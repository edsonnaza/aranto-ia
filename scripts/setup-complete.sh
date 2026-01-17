#!/bin/bash

##############################################################################
# Script Master para Setup Completo desde Cero
# Ejecuta todos los pasos en orden:
# 1. Inicia Docker Compose
# 2. Importa base de datos legacy
# 3. Configura todas las bases de datos
#
# Uso: bash ./scripts/setup-complete.sh [ruta-archivo.sql]
##############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Valores por defecto
BACKUP_FILE="${1:-/Users/edsonnaza/Desktop/db_legacy_infomed.sql}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SETUP COMPLETO - ARANTO DESDE CERO               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Este script ejecutará 3 pasos:"
echo "  1️⃣  Iniciar Docker Compose"
echo "  2️⃣  Importar base de datos legacy"
echo "  3️⃣  Configurar todas las bases de datos"
echo ""
echo "Tiempo estimado: 25-35 minutos"
echo ""
read -p "¿Deseas continuar? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}Cancelado${NC}"
    exit 1
fi

# ============================================================================
# PASO 1: Iniciar Docker Compose
# ============================================================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PASO 1: Iniciando Docker Compose                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_DIR"

echo -e "${YELLOW}Verificando si Docker Compose está corriendo...${NC}"
if docker compose ps mysql > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker Compose ya está corriendo${NC}"
else
    echo -e "${YELLOW}Iniciando Docker Compose...${NC}"
    docker compose up -d
    
    echo -e "${YELLOW}Esperando a que MySQL esté listo...${NC}"
    sleep 10
    
    # Esperar a que MySQL esté completamente listo
    COUNTER=0
    until docker compose exec -T mysql mysql -uroot -p4r4nt0 -e "SELECT 1" > /dev/null 2>&1; do
        if [ $COUNTER -lt 30 ]; then
            echo -e "${YELLOW}Esperando MySQL... ($COUNTER/30)${NC}"
            sleep 2
            ((COUNTER++))
        else
            echo -e "${RED}✗ Timeout esperando MySQL${NC}"
            exit 1
        fi
    done
fi

echo -e "${GREEN}✓ Docker Compose está listo${NC}"
echo ""

# ============================================================================
# PASO 2: Importar Base de Datos Legacy
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PASO 2: Importando Base de Datos Legacy                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}✗ Error: Archivo no encontrado${NC}"
    echo "  Buscado en: $BACKUP_FILE"
    echo ""
    echo "Opción 1: Proporciona la ruta como argumento:"
    echo "  bash ./scripts/setup-complete.sh /ruta/al/db_legacy_infomed.sql"
    echo ""
    echo "Opción 2: Salta este paso (testing sin legacy)"
    read -p "¿Deseas continuar sin legacy? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${RED}Cancelado${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Ejecutando script de importación...${NC}"
    bash ./scripts/import-legacy-database.sh "$BACKUP_FILE"
    echo ""
fi

# ============================================================================
# PASO 3: Configurar Todas las Bases de Datos
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PASO 3: Configurando Todas las Bases de Datos            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Ejecutando setup:all-database...${NC}"
docker compose exec app php artisan setup:all-database

echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ SETUP COMPLETADO EXITOSAMENTE                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Bases de Datos Disponibles:${NC}"
echo "  • ${BLUE}db_legacy_infomed${NC}       - Base de datos legacy (si fue importada)"
echo "  • ${BLUE}aranto_medical${NC}          - Base de datos de producción"
echo "  • ${BLUE}aranto_medical_testing${NC}  - Base de datos de testing"
echo ""

echo -e "${GREEN}Próximos pasos:${NC}"
echo ""
echo "1. Verifica que la aplicación inicia:"
echo -e "   ${BLUE}docker compose exec app php artisan tinker${NC}"
echo ""
echo "2. Ejecuta los tests:"
echo -e "   ${BLUE}docker compose exec app php artisan test${NC}"
echo ""
echo "3. Abre la aplicación en el navegador:"
echo -e "   ${BLUE}open http://localhost${NC}"
echo ""
echo -e "${GREEN}¡Bienvenido a Aranto! 🚀${NC}"
echo ""
