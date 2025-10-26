# API Documentation - Módulo de Caja Registradora

## Resumen de Endpoints Implementados

### 🏪 Cash Register API (`/api/cash-register`)

| Método | Endpoint | Middleware | Descripción |
|---------|----------|------------|-------------|
| GET | `/active-session` | `auth:sanctum` | Obtener sesión activa del usuario |
| POST | `/open` | `permission:cash_register.open` | Abrir nueva sesión de caja |
| POST | `/close` | `permission:cash_register.close` | Cerrar sesión de caja actual |
| POST | `/force-close/{sessionId}` | `permission:cash_register.force_close` | Forzar cierre de sesión (admin) |
| GET | `/history` | `permission:cash_register.view` | Obtener historial de sesiones |
| GET | `/statistics` | `permission:reports.cash_register` | Estadísticas de caja |

### 💰 Transaction API (`/api/transactions`)

| Método | Endpoint | Middleware | Descripción |
|---------|----------|------------|-------------|
| POST | `/service-payment` | `permission:payments.process` | Procesar pago de servicio médico |
| POST | `/supplier-payment` | `permission:payments.process` | Procesar pago a proveedor/gasto |
| GET | `/current-session` | `permission:transactions.view` | Transacciones de sesión actual |
| GET | `/{transactionId}` | `permission:transactions.view` | Detalle de transacción específica |
| POST | `/{transactionId}/void` | `permission:transactions.void` | Anular transacción |

### 📋 Audit API (`/api/audit`)

| Método | Endpoint | Middleware | Descripción |
|---------|----------|------------|-------------|
| GET | `/logs` | `permission:audit.view` | Logs de auditoría generales |
| GET | `/session/{sessionId}` | `permission:audit.view_sessions` | Auditoría de sesión específica |
| GET | `/transaction/{transactionId}` | `permission:audit.view_transactions` | Auditoría de transacción |
| GET | `/user-activity` | `permission:reports.user_activity` | Reporte de actividad por usuario |
| GET | `/system-summary` | `permission:reports.system_summary` | Resumen de actividad del sistema |
| POST | `/search` | `permission:audit.search` | Buscar en logs de auditoría |

### 🏥 Services API (`/api/services`)

| Método | Endpoint | Middleware | Descripción |
|---------|----------|------------|-------------|
| GET | `/` | `auth:sanctum` | Listar servicios médicos |
| GET | `/{serviceId}` | `auth:sanctum` | Detalle de servicio específico |
| POST | `/` | `permission:services.create` | Crear nuevo servicio |
| PUT | `/{serviceId}` | `permission:services.edit` | Actualizar servicio existente |
| DELETE | `/{serviceId}` | `permission:services.delete` | Desactivar servicio |
| POST | `/{serviceId}/activate` | `permission:services.edit` | Reactivar servicio |
| GET | `/reports/statistics` | `permission:reports.services` | Estadísticas de servicios |

## 🔒 Sistema de Permisos

### Roles Definidos:
- **Administrador**: Acceso completo (22 permisos)
- **Cajero**: Operación básica de caja (10 permisos)
- **Auditor**: Solo lectura y reportes (9 permisos)
- **Gerente**: Supervisión y autorización (14 permisos)

### Permisos por Categoría:

#### Cash Register (Caja Registradora)
- `cash_register.open` - Abrir sesión de caja
- `cash_register.close` - Cerrar sesión de caja
- `cash_register.view` - Ver historial de sesiones
- `cash_register.view_all` - Ver sesiones de todos los usuarios
- `cash_register.force_close` - Forzar cierre de sesión

#### Payments (Pagos)
- `payments.process` - Procesar pagos y cobros
- `payments.refund` - Procesar reembolsos

#### Transactions (Transacciones)
- `transactions.view` - Ver transacciones
- `transactions.view_all` - Ver todas las transacciones
- `transactions.void` - Anular transacciones

#### Services (Servicios)
- `services.create` - Crear servicios médicos
- `services.edit` - Editar servicios
- `services.delete` - Desactivar servicios
- `services.view_all` - Ver todos los servicios

#### Audit (Auditoría)
- `audit.view` - Ver logs de auditoría
- `audit.view_sessions` - Auditoría de sesiones
- `audit.view_transactions` - Auditoría de transacciones
- `audit.view_all` - Ver toda la auditoría
- `audit.search` - Buscar en auditoría

#### Reports (Reportes)
- `reports.cash_register` - Reportes de caja
- `reports.services` - Reportes de servicios
- `reports.user_activity` - Actividad de usuarios
- `reports.system_summary` - Resumen del sistema

## 📝 Formato de Respuesta Estándar

### Éxito
```json
{
  "success": true,
  "message": "Operación completada correctamente",
  "data": {
    // Datos específicos del endpoint
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": {
    // Errores de validación (opcional)
  }
}
```

## 🚀 Estado de Implementación

### ✅ Completado (T031-T050)
- [x] CashRegisterController con 6 endpoints
- [x] TransactionController con 5 endpoints  
- [x] AuditController con 6 endpoints
- [x] ServiceController con 7 endpoints
- [x] Middleware de permisos configurado
- [x] 25 rutas API registradas
- [x] Sistema de roles y permisos activo

### 🎯 Próximo: Componentes React (T051-T080)
- Dashboard de caja registradora
- Formularios de pago
- Reportes de auditoría
- Gestión de servicios

La API está lista para ser consumida por el frontend React con Inertia.js.