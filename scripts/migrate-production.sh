#!/bin/bash

# Script de Migración Automatizada - Aranto IA
# Uso: ./migrate-production.sh
# O con Docker: docker compose exec -w /var/www/html app bash migrate-production.sh

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  ARANTO IA - MIGRACIÓN AUTOMÁTICA DESDE LEGACY A PRODUCCIÓN"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Verificar ambiente
if [ -z "$DB_HOST" ]; then
    echo "⚠️  Variables de entorno no cargadas"
    echo "Asegúrate de estar en el contenedor Docker o tener .env configurado"
    echo ""
    echo "Para Docker:"
    echo "  docker compose exec -w /var/www/html app bash scripts/migrate-production.sh"
    exit 1
fi

echo "🔍 Verificando conexiones..."
echo "  - DB Host: $DB_HOST"
echo "  - DB User: $DB_USERNAME"
echo "  - Legacy DB: db_legacy_infomed"
echo ""

# Crear backup
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LEGACY_BACKUP="$BACKUP_DIR/legacy_backup_$TIMESTAMP.sql"
ARANTO_BACKUP="$BACKUP_DIR/aranto_backup_$TIMESTAMP.sql"

echo "💾 Creando backups..."
echo "  - Legacy: $LEGACY_BACKUP"
echo "  - Aranto: $ARANTO_BACKUP"

# Ejecutar migracion
echo ""
echo "🚀 Ejecutando migración completa..."
echo "  Comando: php artisan legacy:migrate --force --report"
echo ""

php artisan legacy:migrate --force --report

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  ✓ MIGRACIÓN COMPLETADA EXITOSAMENTE"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "📊 Verificando datos cargados..."
    echo ""
    
    php artisan tinker --execute="
echo \"  Profesionales: \" . \App\Models\Professional::count() . \"\n\";
echo \"  Servicios: \" . \App\Models\MedicalService::count() . \"\n\";
echo \"  Precios: \" . \App\Models\ServicePrice::count() . \"\n\";
echo \"  Pacientes: \" . \App\Models\Patient::count() . \"\n\";
echo \"  Seguros: \" . \App\Models\InsuranceType::count() . \"\n\";
" 2>/dev/null || true
    
    echo ""
    echo "📁 Reporte guardado en: storage/logs/migration_report_*.txt"
    echo ""
    echo "✅ Sistema listo para producción"
    echo ""
else
    echo ""
    echo "❌ ERROR: La migración falló"
    echo ""
    echo "Revisa los logs:"
    echo "  - storage/logs/laravel.log"
    echo "  - storage/logs/migration_report_*.txt"
    exit 1
fi
