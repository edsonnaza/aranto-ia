# Backfill `transactions.service_request_id`

Resumen
- Este documento explica cómo ejecutar el backfill que asigna `transactions.service_request_id` basándose en coincidencias entre `transactions.concept` y `service_requests.request_number`.

Requisitos
- Tener `docker-compose` disponible y el servicio MySQL llamado `mysql` (o ajustar `MYSQL_SERVICE` en el script).
- Hacer un backup antes de aplicar cambios.

Archivos
- Script: `scripts/backfill_transactions_service_request_id.sh`

Pasos (rápidos)
1. Preview (sin cambios):

```bash
cd /path/to/aranto-ia
bash scripts/backfill_transactions_service_request_id.sh
```

2. Si los resultados de preview están OK, ejecutar con --apply (crea backup en `tmp/backups`):

```bash
bash scripts/backfill_transactions_service_request_id.sh --apply
```

Verificación manual (alternativa)
- Conteo de coincidencias que se actualizarían:

```sql
SELECT COUNT(t.id) AS to_update
FROM transactions t
JOIN service_requests sr ON t.concept LIKE CONCAT('%', sr.request_number, '%')
WHERE t.service_request_id IS NULL;
```

- Muestra de matches (sample):

```sql
SELECT t.id, t.concept, sr.id AS service_request_id, sr.request_number
FROM transactions t
JOIN service_requests sr ON t.concept LIKE CONCAT('%', sr.request_number, '%')
WHERE t.service_request_id IS NULL
LIMIT 50;
```

Rollback
- Si algo sale mal, restaurar desde el backup generado por el script (archivo `.sql.gz` en `tmp/backups/`). Ejemplo:

```bash
gunzip -c tmp/backups/backfill_transactions_YYYYmmdd_HHMMSS.sql.gz | docker-compose exec -T mysql mysql -uroot -ppassword aranto_medical
```

Notas y riesgos
- El script usa una coincidencia `LIKE` contra `request_number`. Eso es lo mismo que el backfill previo del repositorio; revisa la muestra antes de aplicar.
- Ejecuta primero en staging.
- Si prefieres lógica más estricta (por ejemplo parsing del `concept` para extraer exactamente `REQ-...`), puedo adaptar el script para que sea más conservador.

Contacto
- Si quieres, ejecuto las comprobaciones de salida si pegas aquí los resultados del preview y del apply.
