# Aranto-IA

Sistema de gestión médica con módulo de caja desarrollado con Laravel, Inertia, React y TypeScript. Este archivo queda como la única documentación operativa visible en la raíz del repositorio.

## Resumen

- Backend: Laravel + PHP
- Frontend: React 18 + TypeScript + Inertia.js
- Base de datos: MySQL 8
- Infraestructura local: Docker Compose
- UI: Tailwind CSS + shadcn/ui
- Permisos: Spatie Laravel Permission

## Inicio Rápido

### Requisitos

- Docker
- Docker Compose
- Git

### Levantar el proyecto

```bash
git clone git@github.com:edsonnaza/aranto-ia.git
cd aranto-ia
cp .env.example .env
cd app
cp .env.example .env
cd ..
docker compose up -d
```

**Eso es todo!** El Docker ejecuta automáticamente:
- ✅ `php artisan migrate`
- ✅ `php artisan db:seed`
- ✅ Frontend build con Vite
- ✅ Limpieza de cachés

### Accesos locales

- Aplicación: http://localhost:8000
- PHPMyAdmin: http://localhost:8081
- MySQL: localhost:3307
- Redis: localhost:6380

### Usuarios de prueba

- Super Admin: admin@aranto.com / password
- Cajero: cajero@aranto.com / password
- Doctor: doctor@aranto.com / password
- Supervisor: supervisor@aranto.com / password
- Auditor: auditor@aranto.com / password

## Base de Datos y Docker

Este proyecto corre sobre Docker. No hay una configuración local soportada fuera de contenedores.

Configuración Laravel recomendada en app/.env:

```env
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=aranto_medical
DB_USERNAME=aranto_user
DB_PASSWORD=4r4nt0
```

Comandos útiles:

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f mysql
docker compose restart
docker compose down
docker compose up -d --build
```

## Migración Legacy

Para migrar datos legacy a la base actual:

```bash
docker compose exec app php artisan legacy:migrate --force
```

Qué hace el flujo:

- importa y transforma datos legacy
- ejecuta sanitización y limpieza de texto
- preserva idempotencia para reintentos controlados
- genera reportes y logs de ejecución

Si necesitas importar una base legacy completa y preparar entorno desde cero:

```bash
bash ./scripts/setup-complete.sh /ruta/al/archivo.sql
```

## Validación de Cambios y Pull Requests

**Ver checklist completo en:** [`PREMERGE_VALIDATION.md`](PREMERGE_VALIDATION.md)

Antes de hacer merge de una PR, asegúrate de:

### En tu PC (Dev)

```bash
# 1. Verifica que Docker compila sin errores
docker compose down -v
docker compose build

# 2. Levanta todo limpio
docker compose up -d

# 3. Verifica logs sin errores
docker compose logs app | grep -i "error\|exception"
docker compose logs mysql | grep -i "error"

# 4. Si hay cambios en migraciones, verifica que se ejecutaron
docker compose logs app | grep "Running migrations"

# 5. Accede a la app
curl http://localhost:8000/
```

### Validación automática (CI/CD)

Antes de mergear:
- ✅ TypeScript compila sin errores (`npm run build`)
- ✅ PHP no tiene sintaxis errors
- ✅ Migraciones ejecutan correctamente
- ✅ Base de datos inicializa sin errores
- ✅ Tests pasan (si existen)

### Cambios críticos que necesitan validación extra

| Cambio | Validar | Comando |
|--------|---------|---------|
| Nueva migración | Ejecuta en BD limpia | `docker compose exec app php artisan migrate:fresh` |
| Cambio en .env | Funciona en PC1, PC2 y Railway | Verificar variables en todos los `docker-compose.yml` |
| Script Docker | Ejecuta sin errores | `docker compose build --no-cache` |
| Credenciales | No hardcodeadas, usan .env | `grep -r "password\|key" app/ \| grep -v ".env"` |

## Infraestructura Multi-Ambiente

### PC 1 / PC 2 (Local)
- Lee: `.env` (raíz) + `app/.env`
- Docker: `docker-compose.yml`
- Base: MySQL local (volumen Docker)
- Inicialización: Automática en `docker-entrypoint.sh`

### Production (Railway)
- Lee: Variables de entorno de Railway
- Base: MySQL externa configurada en Railway
- Inicialización: `php artisan migrate --force` en el procfile

**Importante:** Si cambias credenciales o estructura, actualiza `.env.example` para que el siguiente clone funcione igual.

## Consultorio (Lista de espera)

Se agregó un flujo de "consultorio" para separar la lógica clínica de la financiera.

- Ver la cola del médico (debe estar autenticado como `doctor`): `/medical/consultorio/queue`
- Desde Recepción se puede enviar un `service_request` a la cola mediante la acción `POST /medical/reception/service-requests/{serviceRequest}/send-to-consultorio` (payload: `doctor_id`, `priority`).

Reglas básicas:
- Solo se puede enviar a consultorio si el servicio está pagado (o si el usuario tiene permiso explícito para forzar envío).
- La atención y generación de `MedicalRecord` se realiza dentro del contexto del médico autenticado.

```

## Desarrollo Diario

### Arranque rápido con Reverb

```bash
sh ./scripts/dev-reverb-up.sh
```

Alternativa con Artisan desde la carpeta app:

```bash
php artisan dev:realtime up --build
php artisan dev:realtime logs
php artisan dev:realtime ps
php artisan dev:realtime down
```

Para detener solo el stack de desarrollo principal:

```bash
sh ./scripts/dev-reverb-down.sh
```

Puertos usados para WebSocket:

- Interno Docker Reverb: 8080
- Expuesto al host: 8585

### Backend

```bash
docker compose exec app php artisan migrate
docker compose exec app php artisan test
docker compose exec app php artisan tinker
```

### Frontend

```bash
docker compose exec app npm install
docker compose exec app npm run dev
docker compose exec app npm run build
```

### Limpieza y cache

```bash
docker compose exec app php artisan cache:clear
docker compose exec app php artisan config:clear
docker compose exec app php artisan route:clear
docker compose exec app php artisan view:clear
```

## Convenciones del Proyecto

### Arquitectura

- Los controladores devuelven respuestas Inertia.
- La lógica de negocio vive en servicios de Laravel.
- Las rutas del dominio médico están en app/routes/medical.php.
- React consume datos mediante hooks personalizados; no mediante fetch ad hoc en páginas cuando ya existe hook del dominio.

### Frontend

- Las páginas Inertia viven en app/resources/js/pages.
- Los componentes reutilizables viven en app/resources/js/components.
- Los hooks de dominio viven en app/resources/js/hooks.
- Los tipos compartidos viven en app/resources/js/types.

### Permisos

- El sistema usa Spatie Laravel Permission.
- La navegación y acciones visibles deben respetar permisos y roles.
- Los cambios de menú o sidebar deben considerarse junto con permisos asociados.

### UI y patrones

- Formato monetario consistente en guaraníes.
- Layouts y estados visuales deben seguir los patrones existentes.
- Los mensajes flash y estados de error deben mantenerse homogéneos.

## Estructura del Repositorio

```text
aranto-ia/
├── app/
│   ├── app/
│   ├── resources/js/
│   ├── routes/
│   ├── tests/
│   └── ...
├── database/
├── docs/
├── scripts/
├── specs/
├── docker-compose.yml
└── README.md
```

## Troubleshooting

### Docker no inicia

```bash
docker compose down -v
docker compose up -d
```

### La app no conecta a MySQL

- verifica que DB_HOST sea mysql
- verifica que el contenedor mysql esté healthy
- revisa app/.env y docker-compose.yml

### Error 500

```bash
docker compose logs -f app
docker compose exec app tail -f storage/logs/laravel.log
```

### Rehacer setup completo

```bash
bash ./scripts/setup-complete.sh /ruta/al/archivo.sql
```

## Qué se Mantiene Fuera de Este README

Para no seguir llenando la raíz de reportes e historiales:

- specs/ conserva especificaciones de trabajo y planificación
- docs/ conserva documentación puntual de scripts o procesos aislados
- .github/ y .specify/ conservan archivos de tooling y automatización

## Estado

El repositorio quedó limpiado para usar un solo documento central en la raíz. La documentación histórica, redundante o de cierre de tareas fue retirada de ese nivel para reducir ruido.