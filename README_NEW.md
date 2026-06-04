# Aranto IA - Medical Management System

> Full-stack medical management platform with Laravel 12, Inertia.js, React 18, and Docker

## 📚 Documentation

### Getting Started
- **[SETUP.md](./SETUP.md)** - Complete setup guide for any PC
- **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** - Production deployment on Railway

### Quick Links
- [Local Setup](#-quick-start)
- [Docker Configuration](#-docker-setup)
- [Validation Scripts](#-validation)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- PHP 8.4+ (for local CLI tools)
- Node.js 22+ (for frontend build)

### 1. Clone & Setup

```bash
git clone <repo>
cd aranto-ia

# Copy env files
cp .env.example .env
cp app/.env.example app/.env

# Generate APP_KEY
cd app
php artisan key:generate --show
# Copy the output to .env file in root

# Add key to .env
echo "APP_KEY=base64:YOUR_KEY_HERE" >> ../.env
```

### 2. Validate & Start

```bash
# Validate setup (from root)
bash scripts/validate-setup.sh

# Start Docker
docker compose up -d

# Wait for services to be healthy
docker compose ps
```

### 3. Access Application

| Service | URL | Credentials |
|---------|-----|-------------|
| App | http://localhost:8000 | N/A |
| phpMyAdmin | http://localhost:8081 | root / 4r4nt0 |
| Reverb (WebSockets) | http://localhost:8585 | N/A |
| MySQL | localhost:3307 | root / 4r4nt0 |
| Redis | localhost:6380 | N/A |

---

## 🐳 Docker Setup

### Services

- **PHP-FPM + Laravel**: Application server
- **MySQL 8.0**: Database
- **Redis**: Cache & Queue
- **Reverb**: WebSocket server
- **phpMyAdmin**: Database management

### Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Service orchestration |
| `app/Dockerfile` | Multi-stage build (PHP, Node, Runtime) |
| `app/docker-entrypoint.sh` | Auto-migrations & seeders |
| `.env` | Docker & app configuration |
| `app/.env` | Laravel configuration |

### Auto-Initialization

On startup, the app container automatically:
1. ✅ Waits for MySQL connection
2. ✅ Runs migrations: `php artisan migrate --force`
3. ✅ Seeds database: `php artisan db:seed --force`
4. ✅ Clears caches

---

## 🔍 Validation

### Local Validation

```bash
# Validate everything is configured correctly
bash scripts/validate-setup.sh

# Check specific aspects
docker compose ps                    # Container status
docker compose logs app             # App logs
docker compose exec app php -v      # PHP version
```

### Pre-Commit Checks

Automatically prevents:
- ❌ Committing `.env` files
- ❌ PHP syntax errors
- ❌ Invalid migrations

Install:
```bash
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## 📊 Environment Variables

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_KEY` | _(required)_ | Laravel encryption key |
| `APP_ENV` | local | Environment (local, production) |
| `APP_DEBUG` | true | Debug mode |
| `DB_HOST` | mysql | Database host |
| `REDIS_HOST` | redis | Redis host |

### Local Development

See [.env.example](./.env.example) for all available options.

### Production (Railway)

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for Railway-specific setup.

---

## 🔄 Development Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/something

# 2. Make changes and test locally
docker compose exec app php artisan test

# 3. Validate setup
bash scripts/validate-setup.sh

# 4. Commit (auto-validates with pre-commit hook)
git add .
git commit -m "feat: description"

# 5. Push & create PR
git push origin feature/something
```

### Database Changes

```bash
# Create migration
docker compose exec app php artisan make:migration create_table_name

# Test locally
docker compose exec app php artisan migrate
docker compose exec app php artisan migrate:rollback

# Commit migration files
git add app/database/migrations/
git commit -m "migration: create_table_name"
```

---

## 🚨 Troubleshooting

### Common Issues

**Q: "No application encryption key has been specified"**
```bash
cd app
php artisan key:generate --show
# Copy to .env in root
```

**Q: "MySQL Access denied"**
```bash
# Reset volumes and .env
docker compose down -v
cp .env.example .env
docker compose up -d
```

**Q: Ports already in use**
```bash
# Edit .env to change ports
APP_PORT=8001
MYSQL_PORT=3308
PHPMYADMIN_PORT=8082
```

**Q: Containers won't start**
```bash
docker compose logs app
docker compose logs mysql
# Check .env file is correct
```

See [SETUP.md](./SETUP.md#-problemas-comunes) for more solutions.

---

## 📋 CI/CD Pipeline

### GitHub Actions

Automatic checks on every PR:
- ✅ PHP syntax validation
- ✅ Laravel tests
- ✅ Code style (Pint)
- ✅ Database migrations dry-run

### Deployment

- **Push to `develop`** → Deploy to Railway DEV
- **Push to `main`** → Deploy to Railway PROD

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for details.

---

## 📁 Project Structure

```
aranto-ia/
├── app/                    # Laravel application
│   ├── app/               # Laravel source code
│   ├── resources/js/      # React components & TypeScript
│   ├── database/          # Migrations & seeders
│   ├── Dockerfile         # Multi-stage Docker build
│   └── docker-entrypoint.sh # Auto-migration script
├── docker-compose.yml     # Service orchestration
├── scripts/
│   ├── validate-setup.sh  # Setup validation
│   └── pre-commit.sh      # Git pre-commit hook
├── SETUP.md              # Setup documentation
├── RAILWAY_DEPLOYMENT.md  # Production deployment guide
└── .env.example          # Environment template
```

---

## 🔐 Security Notes

- ✅ `.env` files are in `.gitignore` - NEVER commit them
- ✅ APP_KEY must be kept secret
- ✅ Use strong passwords in production
- ✅ Enable 2FA on Railway & GitHub
- ✅ Review all PRs before merging to main

---

## 🆘 Need Help?

1. Check relevant documentation:
   - [SETUP.md](./SETUP.md) - For local setup
   - [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - For production
   
2. Validate setup:
   ```bash
   bash scripts/validate-setup.sh
   ```

3. Check logs:
   ```bash
   docker compose logs app
   ```

4. Create an issue with:
   - Error message
   - Steps to reproduce
   - Output of `bash scripts/validate-setup.sh`

---

## 📜 License

[Add your license here]

## 👥 Contributors

[Add contributors]

---

**Last Updated:** 2025-01-01  
**Docs Version:** 1.0.0
