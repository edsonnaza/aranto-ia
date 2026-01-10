# Exclusiones de Migración Implementadas

## Resumen

Se han actualizado los seeders de migración para **EXCLUIR 4 categorías que no son servicios médicos**. Estos cambios aseguran que solo se migran productos médicos legítimos de la base de datos legacy.

## Categorías Excluidas

Las siguientes categorías de legacy **NO serán migradas** a `medical_services`:

| ID  | Nombre                    | Razón de Exclusión           |
|-----|---------------------------|------------------------------|
| 38  | SERVICIOS DE COCINA       | No es servicio médico        |
| 42  | Medicamentos              | No es servicio médico        |
| 43  | Descartables              | No es servicio médico        |
| 44  | Otros Farmacia            | No es servicio médico        |

## Mapeo de Categorías Implementado

**Mapeo Directo (Legacy → Aranto)**: `legacy_id = aranto_id`

Categorías a migrar: **22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 45, 46, 47, 48**

Total: 23 categorías de servicios médicos

## Archivos Actualizados

### 1. ServiceCategoriesSeeder.php
**Propósito**: Insertar categorías de servicios médicos en `service_categories`

**Cambios**:
- ✅ Insertará IDs 22-48 (excepto 38, 42, 43, 44)
- ✅ Usa `insertOrIgnore` para evitar duplicados
- ✅ Mapeo directo: preserva los mismos IDs de legacy
- ✅ Comentarios claros sobre categorías excluidas

**Método**: `php artisan db:seed --class=ServiceCategoriesSeeder`

### 2. ServicesFromLegacySeeder.php
**Propósito**: Migrar productos (`producto` → `medical_services`)

**Cambios**:
- ✅ Remueve el mapeo incorrecto antigua (22→7, etc.)
- ✅ Implementa mapeo directo 1:1 (legacy_id = aranto_id)
- ✅ Crea array `$categoriesAllowed` con IDs permitidos
- ✅ Crea array `$categoriesExcluded` con IDs a descartar
- ✅ Query filtra por `whereIn('IdCategoria', $categoriesAllowed)`
- ✅ Muestra advertencia sobre categorías excluidas

**Query clave**:
```php
$legacyProducts = DB::connection('legacy')
    ->table('producto')
    ->whereIn('IdCategoria', $categoriesAllowed)  // ← Filtra categorías permitidas
    ->where('Estado', 'ACTIVO')
    ->get();
```

**Método**: `php artisan db:seed --class=ServicesFromLegacySeeder`

### 3. ServicePricesFromLegacySeeder.php
**Propósito**: Migrar precios (`producto_precios` → `service_prices`)

**Cambios**:
- ✅ Excluye precios de productos en categorías 38, 42, 43, 44
- ✅ Join con tabla `producto` para filtrar por `IdCategoria`
- ✅ Usa `whereNotIn('producto.IdCategoria', $categoriesExcluded)`
- ✅ Mensajes informativos sobre categorías excluidas

**Query clave**:
```php
$legacyPrices = DB::connection('legacy')
    ->table('producto_precios')
    ->join('producto', 'producto_precios.idproducto', '=', 'producto.IdProducto')
    ->whereNotIn('producto.IdCategoria', $categoriesExcluded)  // ← Excluye no-médicas
    ->where('producto_precios.activo', 'SI')
    ->where('producto_precios.eliminado', 'NO')
    ->select('producto_precios.*')
    ->get();
```

**Método**: `php artisan db:seed --class=ServicePricesFromLegacySeeder`

## Verificación de Mapeo

### VerifyMappingConsistency.php
**Propósito**: Validar que el mapeo sea correcto

**Comando**: `php artisan verify:mapping`

**Output esperado**:
- Lista todas las 23 categorías permitidas (22-48 excepto 38, 42-44)
- Muestra mapeo directo (Legacy ID → Aranto ID)
- Valida que cada categoría exista en aranto
- Listado de categorías excluidas con razones

## Flujo de Migración Completo

```
1. ServiceCategoriesSeeder
   └─ Inserta categorías médicas (IDs 22-48, excluye 38, 42-44)

2. ServicesFromLegacySeeder
   └─ Migra 2,611 productos ACTIVOS de legacy
   └─ Solo productos de categorías permitidas
   └─ Crea mapeo legacy_product_id → service_id

3. ServicePricesFromLegacySeeder
   └─ Migra ~7,782 precios de legacy
   └─ Filtra por producto.IdCategoria NOT IN (38, 42, 43, 44)
   └─ Crea mapeo en service_prices (service_id, insurance_type_id)

4. VerifyMappingConsistency
   └─ Valida que todo esté correcto
   └─ Confirma categorías incluidas y excluidas
```

## Recuento de Datos

**Productos a migrar**: ~2,611 (de 2,611 ACTIVOS en legacy)
- Nota: Solo aquellos cuya `IdCategoria` esté en `$categoriesAllowed`

**Precios a migrar**: ~7,782 (de 7,782 en legacy)
- Nota: Solo aquellos cuya `producto.IdCategoria` NO esté en `$categoriesExcluded`

**Categorías de servicios médicos**: 23 (de 27 totales en legacy)

## Validación Post-Migración

Después de ejecutar la migración, verificar:

```bash
# 1. Contar servicios migrados
php artisan tinker
>>> App\Models\MedicalService::count()

# 2. Contar precios migrados
>>> App\Models\ServicePrice::count()

# 3. Verificar categorías
>>> App\Models\ServiceCategory::whereIn('id', [22,23,24,...])->count()

# 4. Buscar servicios sin categoría
>>> App\Models\MedicalService::whereNull('category_id')->count()
```

## Notas Importantes

⚠️ **CRÍTICO**: Los arrays de categorías DEBEN coincidir en los 3 seeders:
- `$categoriesAllowed` en ServicesFromLegacySeeder
- IDs en ServiceCategoriesSeeder
- `$categoriesExcluded` en ServicePricesFromLegacySeeder

✅ **CONFIRMADO**: 
- Aranto ya tiene service_categories con IDs 22-48
- Mapeo es directo 1:1 (no requiere conversión)
- Las 4 categorías excluidas nunca fueron servicios médicos

🔄 **ORDEN DE EJECUCIÓN**:
1. Primero: ServiceCategoriesSeeder (crea categorías)
2. Segundo: ServicesFromLegacySeeder (crea servicios)
3. Tercero: ServicePricesFromLegacySeeder (crea precios)
4. Siempre: VerifyMappingConsistency (valida todo)

## Fecha de Implementación

- **Fecha**: 2025-11-08
- **Autorización**: Confirmado por usuario
- **Status**: ✅ Implementado y listo para pruebas
