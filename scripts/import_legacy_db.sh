#!/bin/bash

# Script para importar la base de datos legacy
# Se ejecuta después de que las bases de datos hayan sido creadas

BACKUP_FILE="/Users/edsonnaza/Desktop/db_legacy_infomed.sql"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Archivo de backup no encontrado: $BACKUP_FILE"
    exit 1
fi

echo "Copiando backup al contenedor..."
MYSQL_CONTAINER=$(docker compose ps mysql -q)
docker cp "$BACKUP_FILE" "$MYSQL_CONTAINER:/tmp/db_legacy_infomed.sql"

echo "Importando base de datos legacy..."
docker exec "$MYSQL_CONTAINER" bash -c "mysql -uroot -p4r4nt0 -e 'SET GLOBAL log_bin_trust_function_creators=1;' && mysql -uroot -p4r4nt0 db_legacy_infomed < /tmp/db_legacy_infomed.sql && mysql -uroot -p4r4nt0 -e 'SET GLOBAL log_bin_trust_function_creators=0;'"

if [ $? -eq 0 ]; then
    echo "Base de datos legacy importada exitosamente"
else
    echo "Error al importar la base de datos legacy"
    exit 1
fi

echo "Copiando datos de aranto_medical a testing..."
docker exec "$MYSQL_CONTAINER" bash -c "mysqldump -uroot -p4r4nt0 aranto_medical | mysql -uroot -p4r4nt0 aranto_medical_testing"

if [ $? -eq 0 ]; then
    echo "Bases de datos copiadas exitosamente"
else
    echo "Error al copiar las bases de datos"
    exit 1
fi
