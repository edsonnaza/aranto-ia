# Guía de Uso - Sistema Global de Colores de Estados

## Descripción General

El sistema de colores global (`status-colors.ts`) proporciona una paleta consistente de colores para todos los estados en la aplicación. Esto asegura que los usuarios vean una experiencia visual coherente en todo el sistema.

## Ubicación del Sistema

**Archivo principal:** `resources/js/lib/constants/status-colors.ts`

## Estados Disponibles

### Liquidación de Comisiones
- `PAID` - Verde (Pagada) - `bg-green-100 text-green-800`
- `PENDING` - Amarillo (Pendiente) - `bg-yellow-100 text-yellow-800`
- `APPROVED` - Azul (Aprobada) - `bg-blue-100 text-blue-800`
- `DRAFT` - Gris (Borrador) - `bg-gray-100 text-gray-800`
- `CANCELLED` - Rojo (Cancelada) - `bg-red-100 text-red-800`

### Servicios Médicos
- `COMPLETED` - Verde (Completado)
- `IN_PROGRESS` - Azul (En Progreso)
- `CANCELLED_SERVICE` - Rojo (Cancelado)

### Pacientes
- `ACTIVE` - Verde (Activo)
- `INACTIVE` - Gris (Inactivo)

### Presupuestos (Budgets) - *Predefinidos para uso futuro*
- `BUDGET_DRAFT` - Gris (Borrador)
- `BUDGET_PENDING` - Amarillo (Pendiente)
- `BUDGET_APPROVED` - Azul (Aprobado)
- `BUDGET_ACTIVE` - Verde (Activo)
- `BUDGET_COMPLETED` - Verde (Completado)
- `BUDGET_EXCEEDED` - Rojo (Excedido)
- `BUDGET_CANCELLED` - Rojo (Cancelado)

## Cómo Usar

### Opción 1: Importar la función helper completa

```typescript
import { getStatusColor } from '@/lib/constants/status-colors'

// En tu componente
<Badge
  variant={getStatusColor('PAID')?.variant}
  className={getStatusColor('PAID')?.className}
>
  {getStatusColor('PAID')?.label}
</Badge>
// Resultado: Badge verde con texto "Pagada"
```

### Opción 2: Usar funciones helper específicas

```typescript
import { 
  getStatusColor,      // Obtiene configuración completa
  getStatusVariant,    // Obtiene solo la variante
  getStatusLabel,      // Obtiene solo la etiqueta en español
  getStatusClassName   // Obtiene solo las clases CSS
} from '@/lib/constants/status-colors'

// Ejemplo con getStatusLabel
<Badge>{getStatusLabel('PENDING')}</Badge>
// Resultado: "Pendiente"
```

### Opción 3: Acceso directo a la constante

```typescript
import { STATUS_COLORS } from '@/lib/constants/status-colors'

// Acceso directo
const color = STATUS_COLORS.PAID
// Resultado: { 
//   variant: 'default',
//   className: 'bg-green-100 text-green-800 border border-green-300',
//   label: 'Pagada'
// }
```

## Implementación Actual

### CommissionDashboard (✅ Actualizado)

El dashboard de comisiones usa el sistema global para mostrar estados de liquidaciones:

```typescript
import { getStatusColor } from '@/lib/constants/status-colors'

// En la tabla de liquidaciones recientes
<Badge
  variant={getStatusColor(liquidation.status)?.variant || 'outline'}
  className={getStatusColor(liquidation.status)?.className}
>
  {getStatusColor(liquidation.status)?.label || liquidation.status}
</Badge>
```

### Medical Dashboard (✅ Actualizado)

El dashboard médico usa colores globales para:
- **Citas Pendientes:** PENDING (amarillo/rojo)
- **Citas Recientes:** COMPLETED (verde)
- **Tipos de Seguro:** ACTIVE (verde)

### Cash Register Dashboard

Puede beneficiarse de estados para:
- Estados de sesiones de caja
- Estados de transacciones
- Estados de pagos

## Mejores Prácticas

1. **Siempre usa el sistema global** - No hardcodees colores en componentes
2. **Mantén consistencia** - Un estado debe verse igual en todos lados
3. **Extiende cuando sea necesario** - Agrega nuevos estados a `STATUS_COLORS` si los necesitas
4. **Documenta nuevos estados** - Actualiza este archivo cuando agregues nuevos estados
5. **Usa getStatusColor()** - Es la forma más segura y flexible de acceder a los colores

## Ejemplo Completo

```typescript
// ❌ MAL - Hardcoded colors
<Badge className="bg-green-100 text-green-800">
  Pagada
</Badge>

// ✅ BIEN - Usa sistema global
import { getStatusColor } from '@/lib/constants/status-colors'

<Badge
  variant={getStatusColor('PAID')?.variant}
  className={getStatusColor('PAID')?.className}
>
  {getStatusColor('PAID')?.label}
</Badge>
```

## Compatibilidad

- **TypeScript:** Completamente tipado
- **Tailwind CSS:** Usa clases de Tailwind estándar
- **Badge Component:** Compatible con componente shadcn/ui Badge
- **Soporte i18n:** Las etiquetas están en español

## Notas de Desarrollo

- El sistema soporta valores dinámicos (puedes pasar variables como status)
- Las funciones helper validan automáticamente y retornan valores por defecto si no existe el estado
- Los colores están definidos usando Tailwind CSS predefinido (compatible con el sistema de diseño actual)

---

**Última actualización:** 2 de enero de 2026
