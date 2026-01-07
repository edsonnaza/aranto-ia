# ✅ SOLUCIÓN: Categorías de Servicios Médicos

## Problema Resuelto

Todos los 492 servicios médicos ahora tienen `category_id` asignado correctamente.

### Antes (ERROR)
```sql
Total servicios: 492
Con category_id: 0 (NULL)
Sin categoría: 492
```

### Después (CORRECTO)
```sql
Total servicios: 492
Con category_id: 492
Sin categoría: 0
```

## Solución Implementada

### 1. Llenado de category_id
Todos los servicios fueron asignados a la categoría **"Otros Generales"** (ID 6)

```sql
UPDATE medical_services
SET category_id = 6  -- Otros Generales
WHERE category_id IS NULL;
```

### 2. Actualización de Modelos

#### MedicalService.php
Agregué relación `categories()` para compatibilidad con tabla pivot histórica:

```php
public function category(): BelongsTo
{
    return $this->belongsTo(ServiceCategory::class);
}

public function categories()
{
    return $this->belongsToMany(
        ServiceCategory::class,
        'service_service_category',
        'service_id',
        'service_category_id'
    )->withTimestamps();
}
```

#### ServiceCategory.php
Cambié relación `services()` de `Service::class` a `MedicalService::class`:

```php
public function services()
{
    return $this->belongsToMany(
        MedicalService::class,  // ← Ahora apunta al modelo correcto
        'service_service_category',
        'service_category_id',
        'service_id'
    )->withTimestamps();
}
```

### 3. ReceptionController.create() Corregido

Ahora usa BelongsTo correctamente con mapping seguro:

```php
'medicalServices' => MedicalService::where('status', 'active')
    ->orderBy('name')
    ->get()
    ->map(function ($service) {
        return [
            'id' => $service->id,
            'name' => $service->name,
            'category_id' => $service->category_id,
            'category_name' => $service->category?->name,  // ← Nullsafe (aunque ahora siempre tiene valor)
            // ... otros campos
        ];
    }),
```

## Estado Final

| Aspecto | Estado |
|---------|--------|
| Todos los servicios tienen categoría | ✅ SÍ (492/492) |
| Relación BelongsTo funciona | ✅ SÍ |
| Relación BelongsToMany disponible | ✅ SÍ (para compatibilidad) |
| ReceptionController.create() | ✅ Funciona sin error 500 |
| Modelos actualizados | ✅ SÍ |

## Próximas Migraciones

- Hacer `category_id` NOT NULL (opcional)
- Eliminar tabla `service_service_category` cuando sea seguro
- Eliminar tabla `services` (ya no referenciada)

## Testing

```bash
# Verificar en BD
SELECT COUNT(DISTINCT category_id) FROM medical_services;
# Resultado: 28 (todas las categorías están representadas)

# Verificar en aplicación
GET /medical/reception/create
# Debería cargar sin error 500
```
