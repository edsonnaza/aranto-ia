# Quickstart: Módulo de Caja

**Creado**: 2025-10-25  
**Objetivo**: Guía rápida para desarrolladores que implementarán el módulo de caja  

## Resumen del Módulo

El módulo de caja maneja todas las transacciones financieras diarias de la clínica médica. Implementa la fórmula: **Saldo Final = Monto Inicial + Σ(Ingresos) - Σ(Egresos)** con trazabilidad completa y capacidad de cancelación de transacciones.

## Stack Tecnológico

- **Backend**: Laravel 10.x + PHP 8.2+
- **Frontend**: React 18 + Inertia.js + Tailwind CSS
- **Base de Datos**: MySQL 8.0 con InnoDB
- **Testing**: PHPUnit + Jest + Laravel Dusk
- **Containerización**: Docker

## Estructura de Archivos Clave

```
app/
├── Models/
│   ├── Caja.php              # Modelo principal de sesión de caja
│   ├── Movimiento.php        # Transacciones individuales
│   └── Comprobante.php       # Documentos generados
├── Services/
│   ├── CajaService.php       # Lógica de negocio principal
│   └── CalculadoraSaldoService.php  # Cálculos financieros
└── Http/Controllers/
    └── CajaController.php    # API endpoints principales

resources/js/Pages/Caja/
├── Index.jsx                 # Dashboard principal
├── Apertura.jsx             # Apertura de caja
├── Cierre.jsx               # Cierre de caja
└── Movimientos.jsx          # Lista de transacciones
```

## Flujo de Trabajo Principal

### 1. Apertura de Caja
```php
// CajaService.php
public function abrirCaja(User $usuario, float $montoInicial): Caja
{
    // Validar que no tenga caja abierta
    // Crear nueva caja con monto inicial
    // Registrar en auditoría
}
```

### 2. Registro de Movimientos
```php
public function registrarMovimiento(array $datos): Movimiento
{
    // Validar caja abierta
    // Crear movimiento con detalles
    // Procesar formas de pago
    // Generar comprobante
    // Actualizar saldo de caja
}
```

### 3. Cálculo de Saldo
```php
// CalculadoraSaldoService.php
public function calcularSaldo(Caja $caja): array
{
    return [
        'inicial' => $caja->monto_inicial,
        'ingresos' => $caja->movimientos()->ingresos()->sum('monto'),
        'egresos' => $caja->movimientos()->egresos()->sum('monto'),
        'calculado' => $inicial + $ingresos - $egresos
    ];
}
```

### 4. Cancelación de Movimientos
```php
public function cancelarMovimiento(Movimiento $movimiento, string $motivo): bool
{
    // Validar permisos y timing
    // Crear movimiento de cancelación
    // Recalcular saldos
    // Generar comprobante de anulación
}
```

## Puntos de Integración

### Con Módulo de Pacientes
```php
// Al cobrar servicios
$paciente = Paciente::find($request->paciente_id);
$serviciosPendientes = $paciente->serviciosPendientes();
```

### Con Módulo de Profesionales
```php
// Al calcular comisiones
$profesional = Profesional::find($movimiento->profesional_id);
$comision = $profesional->calcularComision($monto);
```

### Con Módulo de Servicios
```php
// Al obtener precios
$servicio = Servicio::find($detalle->servicio_id);
$precio = $servicio->getPrecioPorSeguro($paciente->tipo_seguro);
```

## Validaciones Críticas

### Integridad Financiera
- Validar que suma de formas de pago = monto total
- Verificar que no existan transacciones en proceso al cerrar
- Controlar numeración secuencial de comprobantes

### Permisos y Seguridad
- Solo usuarios con rol "cajero" pueden operar
- Cancelaciones de días anteriores requieren supervisor
- Todas las operaciones quedan auditadas

### Cálculos Matemáticos
- Usar precisión decimal (12,2) para montos
- Recalcular totales automáticamente tras cada operación
- Validar diferencias en cierre contra umbrales configurados

## Testing Strategy

### Unit Tests
```php
// tests/Unit/CajaServiceTest.php
public function test_calculo_saldo_correcto()
{
    // Given: Caja con movimientos conocidos
    // When: Se calcula el saldo
    // Then: Fórmula aplicada correctamente
}
```

### Feature Tests
```php
// tests/Feature/CajaTest.php
public function test_flujo_completo_apertura_cierre()
{
    // Given: Usuario autenticado
    // When: Abre caja, registra movimientos, cierra
    // Then: Todos los cálculos son correctos
}
```

### Browser Tests
```php
// tests/Browser/CajaTest.php
public function test_interfaz_cobro_servicios()
{
    // Given: Cajero en interfaz
    // When: Registra cobro de servicio
    // Then: UI actualiza saldo en tiempo real
}
```

## Configuración Inicial

### Variables de Entorno
```bash
# .env
CAJA_UMBRAL_DIFERENCIA=1000.00
CAJA_LIMITE_AUTORIZACION=5000.00
COMPROBANTES_STORAGE_PATH=storage/comprobantes
```

### Migraciones de Base de Datos
```bash
php artisan migrate --path=database/migrations/caja
php artisan db:seed --class=CajaSeeder
```

### Permisos de Usuario
```php
// database/seeders/RolesSeeder.php
$cajero = Role::create(['name' => 'cajero']);
$cajero->givePermissionTo([
    'caja.abrir',
    'caja.cerrar',
    'movimientos.crear',
    'movimientos.cancelar_dia_actual'
]);
```

## Métricas de Performance

### Objetivos
- Apertura/cierre: < 3 segundos
- Registro de movimiento: < 30 segundos
- Cálculo de saldo: < 100ms
- Generación de reporte: < 2 minutos

### Optimizaciones
- Índices en tablas por fecha y usuario
- Cache de saldos en Redis
- Paginación en listados largos
- Compresión de PDFs grandes

## Comandos de Desarrollo

```bash
# Levantar entorno
docker-compose up -d

# Ejecutar tests
php artisan test --testsuite=Caja

# Generar reportes de cobertura
php artisan test --coverage

# Limpiar cache
php artisan cache:clear
php artisan config:clear
```

## Troubleshooting Común

### Error: "Caja ya abierta"
- Verificar en BD: `SELECT * FROM cajas WHERE estado = 'abierta' AND usuario_id = X`
- Solución: Cerrar caja anterior o cambiar estado manualmente

### Error: "Diferencia en cierre excesiva"
- Verificar cálculo: `inicial + ingresos - egresos vs. físico`
- Revisar movimientos cancelados o duplicados

### Error: "Numeración de comprobantes inconsistente"
- Verificar tabla `numeracion_comprobantes`
- Ejecutar comando de reparación si es necesario

Este quickstart proporciona la base necesaria para comenzar la implementación del módulo de caja siguiendo los principios constitucionales del proyecto Aranto.