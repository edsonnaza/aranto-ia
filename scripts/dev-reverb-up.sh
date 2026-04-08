#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")/.."

echo "Levantando app, reverb, mysql y redis..."
docker compose up -d --build app reverb mysql redis

echo "\nServicios disponibles:"
echo "- App: http://localhost:8000"
echo "- Vite: http://localhost:5173"
echo "- Reverb WS: ws://localhost:8585"
echo "- PHPMyAdmin: http://localhost:8081"

echo "\nEstado actual:"
docker compose ps