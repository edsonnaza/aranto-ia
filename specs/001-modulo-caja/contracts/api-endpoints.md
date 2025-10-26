# API Endpoints: Módulo de Caja

**Creado**: 2025-10-25  
**Base URL**: `/api/caja`  
**Autenticación**: Laravel Sanctum  

## Endpoints de Caja

### GET /caja/estado
Obtiene el estado actual de la caja del usuario.

**Respuesta 200:**
```json
{
  "data": {
    "id": 1,
    "estado": "abierta",
    "fecha_apertura": "2025-10-25T08:00:00Z",
    "monto_inicial": 50000.00,
    "saldo_actual": 125000.00,
    "total_ingresos": 85000.00,
    "total_egresos": 10000.00,
    "cantidad_movimientos": 15
  }
}
```

### POST /caja/abrir
Abre una nueva caja para el día.

**Request:**
```json
{
  "monto_inicial": 50000.00
}
```

**Respuesta 201:**
```json
{
  "data": {
    "id": 2,
    "estado": "abierta",
    "fecha_apertura": "2025-10-25T08:00:00Z",
    "monto_inicial": 50000.00,
    "usuario_id": 1
  },
  "message": "Caja abierta exitosamente"
}
```

### POST /caja/cerrar
Cierra la caja actual.

**Request:**
```json
{
  "monto_final_fisico": 125000.00,
  "justificacion_diferencia": "Diferencia menor por redondeo de monedas"
}
```

**Respuesta 200:**
```json
{
  "data": {
    "id": 1,
    "estado": "cerrada",
    "fecha_cierre": "2025-10-25T18:00:00Z",
    "monto_final_fisico": 125000.00,
    "saldo_calculado": 125000.00,
    "diferencia": 0.00,
    "resumen": {
      "monto_inicial": 50000.00,
      "total_ingresos": 85000.00,
      "total_egresos": 10000.00,
      "cantidad_movimientos": 15
    }
  },
  "message": "Caja cerrada exitosamente"
}
```

## Endpoints de Movimientos

### GET /movimientos
Lista los movimientos de la caja actual.

**Query Parameters:**
- `tipo`: INGRESO|EGRESO
- `categoria`: COBRO_SERVICIO|PAGO_PROVEEDOR|etc
- `fecha_desde`: YYYY-MM-DD
- `fecha_hasta`: YYYY-MM-DD
- `page`: número de página
- `per_page`: elementos por página (default: 20)

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": 1,
      "tipo": "INGRESO",
      "categoria": "COBRO_SERVICIO",
      "monto": 25000.00,
      "concepto": "Consulta médica general",
      "paciente": {
        "id": 123,
        "nombre": "Juan Pérez",
        "documento": "12345678"
      },
      "usuario": "María González",
      "estado": "activo",
      "created_at": "2025-10-25T10:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 15,
    "per_page": 20
  }
}
```

### POST /movimientos
Registra un nuevo movimiento.

**Request:**
```json
{
  "tipo": "INGRESO",
  "categoria": "COBRO_SERVICIO",
  "concepto": "Consulta médica general",
  "paciente_id": 123,
  "profesional_id": 456,
  "detalles": [
    {
      "servicio_id": 1,
      "concepto": "Consulta médica",
      "cantidad": 1,
      "precio_unitario": 25000.00,
      "descuento": 0.00
    }
  ],
  "formas_pago": [
    {
      "tipo": "EFECTIVO",
      "monto": 20000.00
    },
    {
      "tipo": "TARJETA_CREDITO",
      "monto": 5000.00,
      "referencia": "AUTH123456",
      "entidad_financiera": "Banco Nacional"
    }
  ]
}
```

**Respuesta 201:**
```json
{
  "data": {
    "id": 16,
    "tipo": "INGRESO",
    "monto": 25000.00,
    "comprobante": {
      "numero": 1456,
      "url_pdf": "/comprobantes/1456.pdf"
    }
  },
  "message": "Movimiento registrado exitosamente"
}
```

### POST /movimientos/{id}/cancelar
Cancela un movimiento existente.

**Request:**
```json
{
  "motivo": "Error en el monto cobrado",
  "requiere_autorizacion": false
}
```

**Respuesta 200:**
```json
{
  "data": {
    "movimiento_original": 16,
    "movimiento_cancelacion": 17,
    "comprobante_anulacion": {
      "numero": 1457,
      "url_pdf": "/comprobantes/anulacion-1457.pdf"
    }
  },
  "message": "Movimiento cancelado exitosamente"
}
```

## Endpoints de Reportes

### GET /reportes/diario
Genera reporte diario de caja.

**Query Parameters:**
- `fecha`: YYYY-MM-DD (default: hoy)
- `formato`: pdf|excel|json

**Respuesta 200:**
```json
{
  "data": {
    "fecha": "2025-10-25",
    "resumen": {
      "monto_inicial": 50000.00,
      "total_ingresos": 85000.00,
      "total_egresos": 10000.00,
      "saldo_final": 125000.00,
      "cantidad_movimientos": 15
    },
    "movimientos_por_categoria": {
      "COBRO_SERVICIO": 75000.00,
      "PAGO_PROVEEDOR": 8000.00,
      "DIFERENCIA_CAJA": 2000.00
    },
    "formas_pago": {
      "EFECTIVO": 60000.00,
      "TARJETA_CREDITO": 15000.00,
      "TARJETA_DEBITO": 10000.00
    }
  },
  "archivo_url": "/reportes/caja-2025-10-25.pdf"
}
```

### GET /reportes/periodo
Genera reporte por período.

**Query Parameters:**
- `fecha_desde`: YYYY-MM-DD
- `fecha_hasta`: YYYY-MM-DD
- `formato`: pdf|excel|json
- `agrupar_por`: dia|semana|mes

**Respuesta 200:**
```json
{
  "data": {
    "periodo": {
      "desde": "2025-10-01",
      "hasta": "2025-10-25"
    },
    "resumen_total": {
      "ingresos": 1250000.00,
      "egresos": 150000.00,
      "neto": 1100000.00,
      "dias_operacion": 20
    },
    "desglose_por_dia": [
      {
        "fecha": "2025-10-25",
        "ingresos": 85000.00,
        "egresos": 10000.00,
        "neto": 75000.00
      }
    ]
  },
  "archivo_url": "/reportes/periodo-oct-2025.pdf"
}
```

## Códigos de Error

### 400 - Bad Request
- `CAJA_YA_ABIERTA`: Ya existe una caja abierta para el usuario
- `CAJA_NO_ABIERTA`: No hay caja abierta para registrar movimientos
- `MONTO_INVALIDO`: El monto debe ser positivo
- `FORMAS_PAGO_NO_COINCIDEN`: La suma de formas de pago no coincide con el total

### 403 - Forbidden
- `SIN_PERMISOS_CAJA`: Usuario no tiene permisos para operar caja
- `AUTORIZACION_REQUERIDA`: Operación requiere autorización de supervisor
- `CAJA_DE_OTRO_USUARIO`: No puede operar caja de otro usuario

### 404 - Not Found
- `MOVIMIENTO_NO_ENCONTRADO`: El movimiento especificado no existe
- `CAJA_NO_ENCONTRADA`: La caja especificada no existe

### 422 - Unprocessable Entity
- `MOVIMIENTO_YA_CANCELADO`: El movimiento ya fue cancelado previamente
- `DIFERENCIA_EXCESIVA`: La diferencia en el cierre supera el umbral permitido
- `TRANSACCIONES_PENDIENTES`: Hay transacciones en proceso, no se puede cerrar

## Validaciones

### Apertura de Caja
- Usuario debe tener rol "cajero" o superior
- No puede existir otra caja abierta para el usuario
- Monto inicial debe ser positivo

### Movimientos
- Caja debe estar abierta
- Suma de formas de pago debe coincidir con monto total
- Todos los servicios deben existir y estar activos
- Paciente debe existir (si se especifica)

### Cierre de Caja
- No deben existir transacciones en proceso
- Diferencia mayor al umbral requiere justificación
- Diferencia mayor al límite requiere autorización

### Cancelaciones
- Solo el mismo día sin autorización
- Días anteriores requieren autorización de supervisor
- No se pueden cancelar movimientos ya cancelados