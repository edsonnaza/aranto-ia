#!/bin/bash

# Script para ejecutar solo los tests de la aplicación (Financial + Medical)
# Uso: ./scripts/test-app.sh [opciones]
# Ejemplos:
#   ./scripts/test-app.sh                    (sin coverage)
#   ./scripts/test-app.sh --coverage         (con coverage)
#   ./scripts/test-app.sh --watch            (modo watch)

cd "$(dirname "$0")/.."

# Captura opciones
COVERAGE=""
WATCH=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage)
      COVERAGE=""
      shift
      ;;
    --no-coverage)
      COVERAGE="--no-coverage"
      shift
      ;;
    --watch)
      WATCH="--watch"
      shift
      ;;
    *)
      echo "Opción desconocida: $1"
      exit 1
      ;;
  esac
done

echo "🧪 Ejecutando tests de la aplicación..."
echo ""

docker compose exec -T app php artisan test \
  tests/App/Financial/ \
  tests/App/Medical/ \
  $COVERAGE \
  $WATCH

exit $?
