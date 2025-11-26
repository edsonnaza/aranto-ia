#!/usr/bin/env bash
set -euo pipefail
# Backfill script for transactions.service_request_id
# Usage:
#   ./scripts/backfill_transactions_service_request_id.sh        # preview (dry-run)
#   ./scripts/backfill_transactions_service_request_id.sh --apply  # run (will create a backup)

DOCKER_COMPOSE_CMD="${DOCKER_COMPOSE_CMD:-docker-compose}"
MYSQL_SERVICE="${MYSQL_SERVICE:-mysql}"
DB_NAME="${DB_NAME:-aranto_medical}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-password}"

APPLY=false
if [ "${1:-}" = "--apply" ]; then
  APPLY=true
fi

echo "DB: ${DB_NAME}  service: ${MYSQL_SERVICE}  preview-only: ${!APPLY@}"

run_mysql() {
  local sql="$1"
  ${DOCKER_COMPOSE_CMD} exec -T ${MYSQL_SERVICE} mysql -u${DB_USER} -p${DB_PASS} -D ${DB_NAME} -e "$sql"
}

echo "1) Preview: cuántas filas potenciales coinciden (transactions.service_request_id IS NULL y concept LIKE request_number)"
run_mysql "SELECT COUNT(t.id) AS to_update
FROM transactions t
JOIN service_requests sr ON t.concept LIKE CONCAT('%', sr.request_number, '%')
WHERE t.service_request_id IS NULL;"

echo "\n2) Muestra (max 50) de matches (transaction.id, concept, sr.id, sr.request_number)"
run_mysql "SELECT t.id, t.concept, sr.id AS service_request_id, sr.request_number
FROM transactions t
JOIN service_requests sr ON t.concept LIKE CONCAT('%', sr.request_number, '%')
WHERE t.service_request_id IS NULL
LIMIT 50;"

if [ "$APPLY" = false ]; then
  echo "\nModo preview: no se aplicaron cambios. Para ejecutar el backfill primero haga backup y luego corra con --apply"
  exit 0
fi

echo "\n3) Ejecutando backup previo (dump de tablas involucradas)..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="tmp/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="${BACKUP_DIR}/backfill_transactions_${TIMESTAMP}.sql.gz"
echo "Backup -> $BACKUP_FILE"
${DOCKER_COMPOSE_CMD} exec -T ${MYSQL_SERVICE} sh -lc "mysqldump -u${DB_USER} -p${DB_PASS} ${DB_NAME} transactions service_requests | gzip -9" > "$BACKUP_FILE"

echo "\n4) Ejecutando backfill en una transacción (UPDATE JOIN)."
SQL=$(cat <<'SQL'
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;

-- Actualizar sólo las filas que no tienen service_request_id y cuya columna concept contiene el request_number
UPDATE transactions t
JOIN service_requests sr ON t.concept LIKE CONCAT('%', sr.request_number, '%')
SET t.service_request_id = sr.id
WHERE t.service_request_id IS NULL;

COMMIT;
SELECT ROW_COUNT() AS rows_affected_after_update;
SQL
)

${DOCKER_COMPOSE_CMD} exec -T ${MYSQL_SERVICE} mysql -u${DB_USER} -p${DB_PASS} -D ${DB_NAME} -e "$SQL"

echo "\n5) Verificación post-backfill: contar filas restantes con service_request_id IS NULL que podrían coincidir"
run_mysql "SELECT COUNT(t.id) AS remaining_null_service_request_id
FROM transactions t
JOIN service_requests sr ON t.concept LIKE CONCAT('%', sr.request_number, '%')
WHERE t.service_request_id IS NULL;"

echo "Backfill completado. Si notas problemas: restaura desde $BACKUP_FILE o contáctame y pego los pasos de rollback." 
