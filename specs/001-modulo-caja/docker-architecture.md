# Docker Configuration for Aranto Medical System

## Environment Setup

### Database Credentials (Standard across all modules)
- **Database Name**: `aranto_medical`
- **Root Password**: `4r4nt0`
- **User**: `aranto_user`
- **User Password**: `4r4nt0`

### Service Ports
- **Application**: 8000 (Laravel)
- **Database**: 3306 (MySQL 8.0)
- **phpMyAdmin**: 8080
- **Redis**: 6379

## Docker Compose Structure

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=local
      - DB_HOST=mysql
      - DB_DATABASE=aranto_medical
      - DB_USERNAME=aranto_user
      - DB_PASSWORD=4r4nt0
      - REDIS_HOST=redis
    volumes:
      - .:/var/www/html
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=4r4nt0
      - MYSQL_DATABASE=aranto_medical
      - MYSQL_USER=aranto_user
      - MYSQL_PASSWORD=4r4nt0
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init:/docker-entrypoint-initdb.d

  phpmyadmin:
    image: phpmyadmin:latest
    ports:
      - "8080:80"
    environment:
      - PMA_HOST=mysql
      - PMA_PORT=3306
      - PMA_USER=root
      - PMA_PASSWORD=4r4nt0
      - MYSQL_ROOT_PASSWORD=4r4nt0
    depends_on:
      - mysql

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

## Application Architecture

### Single Responsibility Principle Implementation

#### Frontend Layer (React + Inertia.js)
```
resources/js/
├── Pages/              # View layer - UI presentation only
│   ├── CashRegister/   # Cash register specific pages
│   ├── Payment/        # Payment processing pages
│   ├── Commission/     # Commission management pages
│   └── Auth/           # Authentication pages
├── Components/         # Reusable UI components (shadcn/ui)
│   ├── ui/            # Base UI components
│   ├── CashRegister/  # Feature-specific components
│   ├── Payment/       # Payment-specific components
│   └── Common/        # Shared components
├── Hooks/             # Custom React hooks - state management logic
│   ├── useCashRegister.js
│   ├── usePayments.js
│   └── useAuth.js
├── Utils/             # Pure utility functions
│   ├── formatters.js  # Currency, date formatting
│   ├── validators.js  # Form validation helpers
│   └── api.js         # API communication helpers
└── Types/             # TypeScript definitions
    ├── cash-register.ts
    ├── payment.ts
    └── user.ts
```

#### Backend Layer (Laravel)
```
app/
├── Http/
│   ├── Controllers/    # HTTP request/response handling ONLY
│   │   ├── CashRegisterController.php
│   │   ├── PaymentController.php
│   │   └── CommissionController.php
│   ├── Requests/      # Form validation and data sanitization
│   │   ├── CashRegisterRequest.php
│   │   ├── PaymentRequest.php
│   │   └── CommissionRequest.php
│   ├── Resources/     # API response transformation
│   │   ├── CashRegisterResource.php
│   │   ├── PaymentResource.php
│   │   └── CommissionResource.php
│   └── Middleware/    # Request/response processing
├── Services/          # Business logic layer
│   ├── CashRegisterService.php
│   ├── PaymentService.php
│   ├── CommissionService.php
│   └── ReportService.php
├── Models/            # Data models - relationships only, NO business logic
│   ├── CashRegister.php
│   ├── Movement.php
│   ├── Payment.php
│   └── User.php
└── Repositories/      # Data access layer (for complex queries)
    ├── CashRegisterRepository.php
    └── PaymentRepository.php
```

#### Database Layer
```
database/
├── migrations/        # Schema definition
├── seeders/          # Initial data population
├── factories/        # Test data generation
└── init/             # Docker initialization scripts
```

## Layer Responsibilities

### Controllers (Thin Layer)
- Receive HTTP requests
- Validate input using Request classes
- Call appropriate Service methods
- Return formatted responses using Resources
- **NO business logic**

### Services (Business Logic Layer)
- Implement business rules
- Coordinate between multiple models
- Handle complex operations
- Manage transactions
- **Contains ALL business logic**

### Models (Data Layer)
- Define relationships
- Handle data casting
- Basic accessors/mutators
- **NO business logic, NO complex calculations**

### Frontend Components
- UI presentation only
- Use hooks for state management
- Call backend APIs through utils
- **NO business logic**

### Hooks (State Management)
- Manage component state
- Handle API calls
- Cache data
- **Frontend business logic only**

## Access Credentials

### phpMyAdmin Access
- URL: `http://localhost:8080`
- Username: `root`
- Password: `4r4nt0`
- Server: `mysql`

### Database Direct Access
- Host: `localhost`
- Port: `3306`
- Database: `aranto_medical`
- Username: `aranto_user` or `root`
- Password: `4r4nt0`

## Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Run migrations**: `docker-compose exec app php artisan migrate`
3. **Seed database**: `docker-compose exec app php artisan db:seed`
4. **Access application**: `http://localhost:8000`
5. **Access phpMyAdmin**: `http://localhost:8080`
6. **View logs**: `docker-compose logs -f app`

## Security Notes

- Password `4r4nt0` is for development only
- Change credentials in production
- Use environment variables for sensitive data
- Enable SSL/TLS in production environment