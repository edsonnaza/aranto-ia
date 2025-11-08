#!/bin/bash

# Script para manejar Vite de forma segura en Docker
# Uso: ./vite-manager.sh [start|stop|restart|status]

ACTION=${1:-start}
CONTAINER_NAME="aranto-ia-app-1"

case $ACTION in
  "status")
    echo "🔍 Verificando estado de Vite..."
    docker compose exec app ps aux | grep -E "(vite|npm.*dev)" | grep -v grep
    if [ $? -eq 0 ]; then
      echo "✅ Vite está corriendo"
    else
      echo "❌ Vite no está corriendo"
    fi
    ;;
    
  "stop")
    echo "🛑 Deteniendo Vite..."
    # Matar procesos de Vite existentes
    docker compose exec app pkill -f "vite" || true
    docker compose exec app pkill -f "npm.*dev" || true
    echo "✅ Procesos de Vite detenidos"
    ;;
    
  "restart")
    echo "🔄 Reiniciando Vite..."
    $0 stop
    sleep 2
    $0 start
    ;;
    
  "start")
    echo "🚀 Iniciando Vite..."
    
    # Verificar si ya está corriendo
    if docker compose exec app ps aux | grep -E "(vite|npm.*dev)" | grep -v grep > /dev/null; then
      echo "⚠️  Vite ya está corriendo. Deteniéndolo primero..."
      $0 stop
      sleep 2
    fi
    
    # Verificar que el contenedor esté corriendo
    if ! docker compose ps | grep -q "aranto-ia-app.*Up"; then
      echo "📦 Iniciando contenedores Docker..."
      docker compose up -d
      sleep 5
    fi
    
    # Limpiar puertos que puedan estar en uso (alternativa sin fuser)
    echo "🧹 Limpiando procesos..."
    docker compose exec app pkill -f "vite" 2>/dev/null || true
    docker compose exec app pkill -f "npm.*dev" 2>/dev/null || true
    
    # Iniciar Vite en background
    echo "🎯 Iniciando servidor de desarrollo..."
    docker compose exec app npm run dev
    ;;
    
  *)
    echo "❓ Uso: $0 [start|stop|restart|status]"
    echo "  start   - Iniciar Vite (por defecto)"
    echo "  stop    - Detener Vite"
    echo "  restart - Reiniciar Vite"
    echo "  status  - Verificar estado"
    exit 1
    ;;
esac