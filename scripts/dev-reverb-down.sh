#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")/.."

echo "Deteniendo app, reverb, mysql y redis..."
docker compose stop app reverb mysql redis

echo "\nEstado actual:"
docker compose ps