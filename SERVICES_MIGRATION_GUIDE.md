# Migración de Servicios desde Legacy

## Descripción
Migración de servicios médicos (productos) desde la base de datos legacy `db_legacy_infomed` a `aranto_medical`.

## Datos a Migrar

### Productos (Medical Services)
- **Origen**: Tabla `producto` en legacy
- **Destino**: Tabla `medical_services` en aranto
- **Filtros**:
  - Solo categorías: 22, 23, 25
  - Solo estado: ACTIVO
- **Campos**:
  - IdProducto → service_id (interno)
  - Nombre → name
  - Descripcion → description
  - Estado → status (siempre "active")
  - IdCategoria → category_id (mapeado a categorías aranto)

### Precios de Servicios
- **Origen**: Tabla `producto_precios` en legacy
- **Destino**: Tabla `service_prices` en aranto
- **Filtros**:
  - activo = 'SI'
  - eliminado = 'NO'
- **Campos**:
  - idproducto → service_id (relación a servicios migrados)
  - idseguro → insurance_type_id (mapeado a tipos de seguro aranto)
  - PrecioVenta → price
  - fecha_inicio → effective_from (o fecha actual)

## Categorías a Migrar
| ID Legacy | Nombre | Acción |
|-----------|--------|--------|
| 22 | Servicios Sanatoriales | Crear si no existe |
| 23 | Consultas Consultorios | Crear si no existe |
| 25 | Servicios Otorrinonaringologia | Crear si no existe |

## Mapeo de Seguros
Legacy idseguro → Aranto insurance_type
- 1 → Particular
- 2 → UNIMED
- 3 → MAPFRE
- 4-9 → SEGUROS MONTERREY
- 10 → Admisionales
- 11 → UNIMED

## Proceso
1. Ejecutar seeder: `php artisan db:seed --class=ServicesFromLegacySeeder`
2. Validar productos creados
3. Validar precios asociados
4. Verificar mapeo de categorías y seguros

## Validaciones
- ✅ No crear duplicados (verificar por nombre)
- ✅ Solo migrar productos ACTIVOS
- ✅ Mapear correctamente tipos de seguro
- ✅ Crear categorías faltantes automáticamente
- ✅ Registrar errores y saltos en la consola

## Notas
- Valores por defecto para campos no migrados:
  - duration_minutes: 30
  - requires_appointment: true
  - requires_preparation: false
  - default_commission_percentage: 0
  - code: generado automáticamente desde nombre del servicio
