#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating Docker Setup..."
echo "================================"

errors=0
warnings=0

# Check Docker
echo -n "✓ Docker installed... "
if ! command -v docker &> /dev/null; then
    echo -e "${RED}FAILED${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}OK${NC}"
fi

# Check Docker Compose
echo -n "✓ Docker Compose installed... "
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}FAILED${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}OK${NC}"
fi

# Check .env file
echo -n "✓ .env file exists... "
if [ ! -f .env ]; then
    echo -e "${RED}FAILED${NC}"
    echo -e "${YELLOW}  → Copy .env.example to .env and fill in values${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}OK${NC}"
    
    # Check APP_KEY is not empty
    echo -n "  ✓ APP_KEY configured... "
    APP_KEY=$(grep "^APP_KEY=" .env | cut -d= -f2)
    if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
        echo -e "${RED}FAILED${NC}"
        echo -e "${YELLOW}    → Run: php artisan key:generate --show${NC}"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}OK${NC}"
    fi
    
    # Check MySQL credentials
    echo -n "  ✓ MySQL ROOT password configured... "
    MYSQL_ROOT_PASSWORD=$(grep "^MYSQL_ROOT_PASSWORD=" .env | cut -d= -f2)
    if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
        echo -e "${RED}FAILED${NC}"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}OK${NC}"
    fi
fi

# Check app/.env file
echo -n "✓ app/.env file exists... "
if [ ! -f app/.env ]; then
    echo -e "${RED}FAILED${NC}"
    echo -e "${YELLOW}  → Copy app/.env.example to app/.env${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}OK${NC}"
fi

# Check Docker containers
echo ""
echo "🐳 Docker Containers Status:"
echo "--------------------------------"

if docker ps -a | grep -q aranto-ia-mysql-1; then
    echo -n "✓ MySQL container... "
    if docker ps | grep -q aranto-ia-mysql-1; then
        echo -e "${GREEN}RUNNING${NC}"
    else
        echo -e "${YELLOW}STOPPED${NC}"
        warnings=$((warnings + 1))
    fi
else
    echo -e "✓ MySQL container... ${YELLOW}NOT CREATED${NC}"
    warnings=$((warnings + 1))
fi

if docker ps -a | grep -q aranto-ia-app-1; then
    echo -n "✓ App container... "
    if docker ps | grep -q aranto-ia-app-1; then
        echo -e "${GREEN}RUNNING${NC}"
    else
        echo -e "${YELLOW}STOPPED${NC}"
        warnings=$((warnings + 1))
    fi
else
    echo -e "✓ App container... ${YELLOW}NOT CREATED${NC}"
    warnings=$((warnings + 1))
fi

if docker ps -a | grep -q aranto-ia-redis-1; then
    echo -n "✓ Redis container... "
    if docker ps | grep -q aranto-ia-redis-1; then
        echo -e "${GREEN}RUNNING${NC}"
    else
        echo -e "${YELLOW}STOPPED${NC}"
        warnings=$((warnings + 1))
    fi
else
    echo -e "✓ Redis container... ${YELLOW}NOT CREATED${NC}"
    warnings=$((warnings + 1))
fi

# Check ports
echo ""
echo "🔌 Port Availability:"
echo "----------------------"
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z localhost $port 2>/dev/null; then
        echo -e "✓ Port $port ($service)... ${GREEN}AVAILABLE${NC}"
    else
        echo -e "✓ Port $port ($service)... ${YELLOW}AVAILABLE${NC}"
    fi
}

check_port 8000 "App"
check_port 8585 "Reverb"
check_port 3306 "MySQL"
check_port 8081 "phpMyAdmin"

echo ""
echo "================================"
if [ $errors -eq 0 ]; then
    if [ $warnings -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed!${NC}"
        echo ""
        echo "📝 Next steps:"
        echo "  1. Start containers: docker compose up -d"
        echo "  2. Run migrations:   docker compose exec app php artisan migrate"
        echo "  3. Run seeders:      docker compose exec app php artisan db:seed"
        echo "  4. Access app:       http://localhost:8000"
        exit 0
    else
        echo -e "${YELLOW}⚠ Checks passed with $warnings warnings${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ $errors error(s) found - Fix and try again${NC}"
    exit 1
fi
