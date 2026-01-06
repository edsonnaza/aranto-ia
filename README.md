# Aranto-IA

Sistema de gestión médica con módulo de caja registradora desarrollado con Laravel + React + TypeScript.

**Estado**: 🚀 **Listo para producción con sistema automatizado de migración Legacy**

## 📚 Documentación Principal

### 🎯 Para Comenzar Rápido
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Índice maestro de toda la documentación
- **[EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)** - Resumen ejecutivo del sistema

### 🚀 Para Ejecutar en Producción
```bash
# Un comando para migrar toda la data de legacy a aranto
# (incluyendo todas las sanitaciones y validaciones)
php artisan legacy:migrate --force
```

Documentación detallada:
- **[AUTOMATED_MIGRATION_GUIDE.md](AUTOMATED_MIGRATION_GUIDE.md)** - Guía rápida y referencia
- **[PRODUCTION_MIGRATION_GUIDE.md](PRODUCTION_MIGRATION_GUIDE.md)** - Checklist completo para producción

### 📊 Para Entender el Sistema
- **[MIGRATION_SYSTEM_DIAGRAM.md](MIGRATION_SYSTEM_DIAGRAM.md)** - Diagramas visuales de los 6 pasos de migración
- **[SANITIZATION_SUMMARY.md](SANITIZATION_SUMMARY.md)** - Detalles técnicos de sanitizaciones
- **[UTF8_CLEANUP_SUMMARY.md](UTF8_CLEANUP_SUMMARY.md)** - Detalles de limpieza UTF-8

## 🚀 Stack Tecnológico

- **Backend**: Laravel 12 + PHP 8.4
- **Frontend**: React 18 + TypeScript + Inertia.js
- **Database**: MySQL 8.0
- **Cache**: Redis
- **UI**: shadcn/ui + Tailwind CSS
- **Permisos**: Spatie Laravel Permission
- **Containerización**: Docker + Docker Compose

## 📋 Requisitos

- Docker
- Docker Compose
- Git

## ⚙️ Configuración

### 1. Clonar el repositorio

```bash
git clone git@github.com:edsonnaza/aranto-ia.git
cd aranto-ia
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` y configura tus credenciales:

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=tu_password_seguro
MYSQL_PASSWORD=tu_password_usuario
# ... resto de configuraciones
```

### 3. Configurar la aplicación Laravel

```bash
cd app
cp .env.example .env
```

Edita `app/.env` con la configuración de base de datos correspondiente.

### 4. Levantar los servicios

```bash
docker compose up -d
```

### 5. Instalar dependencias y configurar Laravel

```bash
# Instalar dependencias de Composer
docker compose exec app composer install

# Generar clave de aplicación
docker compose exec app php artisan key:generate

# Ejecutar migraciones
docker compose exec app php artisan migrate

# Ejecutar seeders
docker compose exec app php artisan db:seed

# Instalar dependencias de NPM
docker compose exec app npm install

# Compilar assets
docker compose exec app npm run build
```

## 🌐 Acceso

- **Aplicación**: http://localhost:8000
- **PHPMyAdmin**: http://localhost:8081
- **MySQL**: localhost:3307
- **Redis**: localhost:6380

## 👥 Usuarios de Prueba

- **Super Admin**: admin@aranto.com / password
- **Cajero**: cajero@aranto.com / password
- **Doctor**: doctor@aranto.com / password
- **Supervisor**: supervisor@aranto.com / password
- **Auditor**: auditor@aranto.com / password

## 🏗️ Arquitectura

### Backend (Laravel)
- **Controladores**: Siguen patrón Inertia.js
- **Modelos**: Eloquent con relaciones definidas
- **Servicios**: Lógica de negocio separada en servicios
- **Permisos**: Sistema granular con 22 permisos específicos
- **Rutas**: Organizadas por módulos

### Frontend (React + TypeScript)
- **Componentes**: shadcn/ui components
- **Páginas**: Inertia.js pages
- **Tipos**: TypeScript para type safety
- **Estilos**: Tailwind CSS

## 📁 Estructura del Proyecto

```
aranto-ia/
├── app/                    # Aplicación Laravel
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── ...
│   ├── resources/js/
│   │   ├── pages/
│   │   ├── components/
│   │   └── types/
│   └── ...
├── docker-compose.yml     # Configuración Docker
├── .env.example           # Template de variables de entorno
└── README.md
```

## 🛡️ Seguridad

- Variables de entorno para datos sensibles
- Sistema de permisos granular
- Validación en backend y frontend
- Sanitización de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y propietario.

## 🐳 Conexión Laravel <-> MySQL (Docker)

Si usas Docker Compose, la configuración recomendada para conectar Laravel con MySQL es:

```env
DB_HOST=mysql
DB_PORT=3307
DB_DATABASE=aranto_medical
DB_USERNAME=aranto_user
DB_PASSWORD=password
```

- El contenedor MySQL expone el puerto interno 3306 en el puerto externo 3307.
- El contenedor `app` depende de que el contenedor `mysql` esté saludable.
- Las credenciales por defecto están definidas en `docker-compose.yml` y pueden ser sobreescritas por variables de entorno.

> Si tienes problemas de conexión, revisa que el contenedor MySQL esté corriendo y que el puerto y usuario coincidan con los valores anteriores.