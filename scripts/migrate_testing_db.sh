#!/bin/bash

# Script para migrar la base de datos testing después de legacy:migrate
# Uso: ./scripts/migrate_testing_db.sh

set -e

echo "=========================================="
echo "Preparando base de datos testing"
echo "=========================================="

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}📋 Ejecutando migraciones en aranto_medical_testing...${NC}"
cd "$PROJECT_DIR/app"

# Ejecutar migraciones en la BD testing
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T app php artisan migrate --env=testing --force

echo -e "${GREEN}✓ Base de datos testing migrada${NC}"

echo -e "${BLUE}🌱 Ejecutando seeders en testing...${NC}"
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T app php artisan db:seed --env=testing --class=DatabaseSeeder

echo -e "${GREEN}✓ Seeders ejecutados${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "✓ Base de datos testing lista"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}Resumen:${NC}"
echo "  ✓ db_legacy_infomed - Para legacy:migrate"
echo "  ✓ aranto_medical_testing - Lista para testing"
echo ""
