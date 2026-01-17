#!/bin/bash

##############################################################################
# Script para importar base de datos legacy desde archivo SQL
# Uso: ./scripts/import-legacy-database.sh [ruta-archivo.sql]
# Por defecto busca en: /Users/edsonnaza/Desktop/db_legacy_infomed.sql
##############################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Valores por defecto
BACKUP_FILE="${1:-/Users/edsonnaza/Desktop/db_legacy_infomed.sql}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    IMPORTADOR DE BASE DE DATOS LEGACY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}✗ Error: Archivo no encontrado${NC}"
    echo -e "  Buscado en: ${BACKUP_FILE}"
    echo ""
    echo "Uso: $0 [ruta-archivo.sql]"
    echo "Ejemplo: $0 /Users/edsonnaza/Desktop/db_legacy_infomed.sql"
    exit 1
fi

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✓ Archivo encontrado:${NC} $BACKUP_FILE"
echo -e "${GREEN}✓ Tamaño:${NC} $FILE_SIZE"
echo ""

# Cambiar al directorio del proyecto
cd "$PROJECT_DIR"
echo -e "${BLUE}Directorio de trabajo:${NC} $(pwd)"
echo ""

# Verificar que docker compose está corriendo
echo -e "${YELLOW}Verificando Docker Compose...${NC}"
if ! docker compose ps mysql > /dev/null 2>&1; then
    echo -e "${RED}✗ Error: Docker Compose no está corriendo${NC}"
    echo "Inicia Docker Compose con: docker compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose está corriendo${NC}"
echo ""

# Obtener el nombre del contenedor MySQL
MYSQL_CONTAINER=$(docker compose ps mysql -q)
if [ -z "$MYSQL_CONTAINER" ]; then
    echo -e "${RED}✗ Error: Contenedor MySQL no encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Contenedor MySQL:${NC} $MYSQL_CONTAINER"
echo ""

# PASO 1: Copiar archivo al contenedor
echo -e "${YELLOW}Copiando archivo al contenedor MySQL...${NC}"
if docker cp "$BACKUP_FILE" "$MYSQL_CONTAINER:/tmp/db_legacy_infomed.sql"; then
    echo -e "${GREEN}✓ Archivo copiado exitosamente${NC}"
else
    echo -e "${RED}✗ Error al copiar archivo${NC}"
    exit 1
fi
echo ""

# PASO 2: Importar archivo
echo -e "${YELLOW}Importando base de datos legacy...${NC}"
echo -e "  Esta operación puede tomar varios minutos dependiendo del tamaño del archivo..."
echo ""

if docker compose exec -T mysql bash -c 'mysql -uroot -p4r4nt0 -e "SET GLOBAL log_bin_trust_function_creators=1;" && mysql -uroot -p4r4nt0 db_legacy_infomed < /tmp/db_legacy_infomed.sql && mysql -uroot -p4r4nt0 -e "SET GLOBAL log_bin_trust_function_creators=0;"'; then
    echo -e "${GREEN}✓ Base de datos legacy importada exitosamente${NC}"
else
    echo -e "${RED}✗ Error al importar base de datos${NC}"
    exit 1
fi
echo ""

# PASO 3: Verificar
echo -e "${YELLOW}Verificando importación...${NC}"
TABLE_COUNT=$(docker compose exec -T mysql mysql -uroot -p4r4nt0 -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='db_legacy_infomed';" 2>/dev/null | tail -1)
echo -e "${GREEN}✓ Tablas en db_legacy_infomed:${NC} $TABLE_COUNT"
echo ""

# Limpiar
echo -e "${YELLOW}Limpiando archivos temporales...${NC}"
docker compose exec -T mysql rm -f /tmp/db_legacy_infomed.sql
echo -e "${GREEN}✓ Limpieza completada${NC}"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ IMPORTACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Próximo paso: ejecuta ${BLUE}php artisan setup:all-database${NC}"
echo ""
