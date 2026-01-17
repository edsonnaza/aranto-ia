#!/bin/bash

# Script maestro para levantar todas las bases de datos y ejecutar migraciones
# Uso: ./scripts/setup_all_databases.sh

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         CONFIGURACIÓN COMPLETA DE BASES DE DATOS          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Paso 1: Levantar bases de datos legacy y testing primero
echo -e "${YELLOW}PASO 1: Levantando bases de datos legacy y testing${NC}"
echo ""
if ! "$PROJECT_DIR/scripts/up_db_legacy_infomed.sh"; then
    echo -e "${RED}✗ Error al levantar bases de datos${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}PASO 2: Ejecutando legacy:migrate${NC}"
echo ""
cd "$PROJECT_DIR/app"
if ! docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T app php artisan legacy:migrate --force; then
    echo -e "${RED}✗ Error al ejecutar legacy:migrate${NC}"
    exit 1
fi

echo -e "${GREEN}✓ legacy:migrate completado${NC}"

echo ""
echo -e "${YELLOW}PASO 3: Migrando base de datos testing${NC}"
echo ""
if ! "$PROJECT_DIR/scripts/migrate_testing_db.sh"; then
    echo -e "${RED}✗ Error al migrar testing${NC}"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo -e "║         ${GREEN}✓ TODAS LAS MIGRACIONES COMPLETADAS${NC}        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Resumen:${NC}"
echo "  ✓ db_legacy_infomed     - Restaurada desde backup"
echo "  ✓ aranto_medical        - Datos actualizados con legacy:migrate"
echo "  ✓ aranto_medical_testing - Copia lista con migraciones"
echo ""
