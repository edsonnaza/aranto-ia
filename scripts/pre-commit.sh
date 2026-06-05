#!/bin/bash

# Pre-commit hook - Valida antes de hacer commit
# Instalar con: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "🔍 Running pre-commit checks..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

errors=0

# 1. Verificar que no se commitea .env
echo -n "  ✓ Checking .env files... "
if git diff --cached --name-only | grep -E "^\.env$|^app/\.env$"; then
    echo -e "${RED}FAILED${NC}"
    echo -e "${RED}    ✗ .env files should NOT be committed!${NC}"
    echo -e "${YELLOW}    → They are in .gitignore for security${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}OK${NC}"
fi

# 2. Verificar sintaxis PHP
echo -n "  ✓ Checking PHP syntax... "
if command -v php &> /dev/null; then
    php_errors=0
    for file in $(git diff --cached --name-only | grep '\.php$'); do
        if [ -f "$file" ]; then
            php -l "$file" > /dev/null 2>&1
            if [ $? -ne 0 ]; then
                php_errors=$((php_errors + 1))
                echo -e "${RED}SYNTAX ERROR in $file${NC}"
            fi
        fi
    done
    if [ $php_errors -eq 0 ]; then
        echo -e "${GREEN}OK${NC}"
    else
        errors=$((errors + 1))
    fi
else
    echo -e "${YELLOW}SKIPPED (PHP not installed)${NC}"
fi

# 3. Verificar que migrations tengan comentarios
echo -n "  ✓ Checking migrations have comments... "
migrations_without_comments=0
for file in $(git diff --cached --name-only | grep "database/migrations"); do
    if [ -f "$file" ]; then
        if ! grep -q "// Migration:" "$file"; then
            migrations_without_comments=$((migrations_without_comments + 1))
        fi
    fi
done
if [ $migrations_without_comments -eq 0 ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}WARN: $migrations_without_comments migration(s) without description${NC}"
fi

echo ""
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✓ All pre-commit checks passed${NC}"
    exit 0
else
    echo -e "${RED}✗ Fix errors and try again${NC}"
    exit 1
fi
