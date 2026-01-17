#!/bin/bash

# Script para levantar las bases de datos legacy y testing
# Uso: ./scripts/up_db_legacy_infomed.sh

set -e

echo "=========================================="
echo "Levantando bases de datos legacy"
echo "=========================================="

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio del proyecto (una carpeta arriba de scripts)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_FILE="$HOME/Desktop/db_legacy_infomed.sql"

# Verificar que el archivo de backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${YELLOW}⚠ Archivo de backup no encontrado: $BACKUP_FILE${NC}"
    exit 1
fi

# Obtener el nombre del contenedor MySQL
MYSQL_CONTAINER=$(cd "$PROJECT_DIR" && docker compose ps mysql -q)

if [ -z "$MYSQL_CONTAINER" ]; then
    echo -e "${YELLOW}⚠ Contenedor MySQL no está corriendo${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Copiando archivo SQL al contenedor...${NC}"
docker cp "$BACKUP_FILE" "$MYSQL_CONTAINER":/tmp/db_legacy_infomed.sql

echo -e "${BLUE}🗄️  Eliminando base de datos legacy anterior...${NC}"
docker exec "$MYSQL_CONTAINER" mysql -uroot -p4r4nt0 -e "DROP DATABASE IF EXISTS db_legacy_infomed;"

echo -e "${BLUE}🗄️  Creando base de datos legacy (db_legacy_infomed)...${NC}"
docker exec "$MYSQL_CONTAINER" mysql -uroot -p4r4nt0 -e "CREATE DATABASE db_legacy_infomed CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo -e "${BLUE}🗄️  Restaurando datos desde backup...${NC}"
docker exec "$MYSQL_CONTAINER" bash -c "mysql -uroot -p4r4nt0 -e 'SET GLOBAL log_bin_trust_function_creators=1;' && mysql -uroot -p4r4nt0 db_legacy_infomed < /tmp/db_legacy_infomed.sql && mysql -uroot -p4r4nt0 -e 'SET GLOBAL log_bin_trust_function_creators=0;'"

echo -e "${GREEN}✓ Base de datos legacy restaurada${NC}"

echo -e "${BLUE}🗄️  Eliminando base de datos testing anterior...${NC}"
docker exec "$MYSQL_CONTAINER" mysql -uroot -p4r4nt0 -e "DROP DATABASE IF EXISTS aranto_medical_testing;"

echo -e "${BLUE}🗄️  Creando copia de aranto_medical como aranto_medical_testing...${NC}"
docker exec "$MYSQL_CONTAINER" mysql -uroot -p4r4nt0 -e "CREATE DATABASE aranto_medical_testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Usar mysqldump para copiar la estructura y datos
docker exec "$MYSQL_CONTAINER" bash -c \
  "mysqldump -uroot -p4r4nt0 aranto_medical | mysql -uroot -p4r4nt0 aranto_medical_testing"

echo -e "${GREEN}✓ Base de datos testing creada${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "✓ Bases de datos levantadas exitosamente"
echo "==========================================${NC}"

# Listar bases de datos
echo ""
echo -e "${BLUE}📊 Bases de datos actuales:${NC}"
docker exec "$MYSQL_CONTAINER" mysql -uroot -p4r4nt0 -e "SHOW DATABASES;"

echo ""
echo -e "${YELLOW}Ahora puedes ejecutar: php artisan legacy:migrate --force${NC}"
