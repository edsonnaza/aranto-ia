# Date Utils - Guía de Uso Global

## Ubicación
`resources/js/utils/date-utils.ts`

## Funciones Disponibles

### 1. `formatBirthDate(birthDate, locale?)`
**Propósito:** Formato estándar para fechas de nacimiento
**Resultado:** "28 de agosto de 1988" (mes en letras)
**Uso:**
```tsx
import { formatBirthDate } from '@/utils/date-utils'

const formatted = formatBirthDate(patient.birth_date)
// Output: "28 de agosto de 1988" o "No especificada"
```

### 2. `calculateAge(birthDate)`
**Propósito:** Calcular edad desde fecha de nacimiento
**Resultado:** "28 años" o error si la fecha es inválida
**Uso:**
```tsx
import { calculateAge } from '@/utils/date-utils'

const age = calculateAge(patient.birth_date)
// Output: "28 años" o "No calculable"
```

### 3. `formatDateForInput(dateStr)`
**Propósito:** Convertir fecha para input type="date"
**Resultado:** "YYYY-MM-DD"
**Uso:**
```tsx
import { formatDateForInput } from '@/utils/date-utils'

const inputValue = formatDateForInput(patient.birth_date)
// Output: "1988-08-28"
```

### 4. `parseDateWithoutUTC(dateStr)`
**Propósito:** Parser seguro de fechas sin interpretación UTC
**Resultado:** Date object en zona horaria local
**Nota:** Esta función se usa internamente en las otras. Úsala solo si necesitas hacer algo personalizado.
**Uso:**
```tsx
import { parseDateWithoutUTC } from '@/utils/date-utils'

const dateObj = parseDateWithoutUTC('1988-08-28')
```

## ⚠️ IMPORTANTE - Reglas de Oro

### ❌ NO HACER:
```tsx
// ❌ NUNCA uses new Date() directamente con strings ISO
new Date(patient.birth_date) // INCORRECTO - UTC issue

// ❌ NUNCA uses toLocaleDateString sin el helper
patient.birth_date.split(' ')[0] // INCORRECTO

// ❌ NUNCA duples la lógica de parseo
const [year, month, day] = dateStr.split('-') // Usa el helper
```

### ✅ SIEMPRE HACER:
```tsx
// ✅ Importa el helper específico que necesitas
import { formatBirthDate } from '@/utils/date-utils'

// ✅ Úsalo en cualquier vista de nacimiento
<p>{formatBirthDate(patient.birth_date)}</p>

// ✅ Para edad:
import { calculateAge } from '@/utils/date-utils'
<p>{calculateAge(patient.birth_date)}</p>

// ✅ Para inputs:
import { formatDateForInput } from '@/utils/date-utils'
<input type="date" value={formatDateForInput(patient.birth_date)} />
```

## Dónde Usar

### 📋 Componentes que YA usan estos helpers:
- `pages/medical/patients/Show.tsx` - ✅ Actualizado
- `pages/medical/patients/Index.tsx` - ✅ Actualizado
- `pages/medical/patients/Edit.tsx` - ✅ Usa formatDateForInput

### 📋 Nuevos componentes que DEBEN usarlos:
- Cualquier página que muestre `patient.birth_date`
- Cualquier tabla/lista con fechas de nacimiento
- Cualquier input de fecha de nacimiento

### Búsqueda rápida:
Si ves esto en un componente:
```tsx
new Date(something_with_date)
toLocaleDateString
```
**PROBABLEMENTE NECESITA USAR ESTOS HELPERS**

## Ejemplo Completo

```tsx
import { formatBirthDate, calculateAge, formatDateForInput } from '@/utils/date-utils'

export default function PatientCard({ patient }) {
  return (
    <>
      {/* Mostrar fecha de nacimiento */}
      <p>Nacimiento: {formatBirthDate(patient.birth_date)}</p>
      
      {/* Mostrar edad */}
      <p>Edad: {calculateAge(patient.birth_date)}</p>
      
      {/* Input para editar */}
      <input 
        type="date" 
        value={formatDateForInput(patient.birth_date)} 
      />
    </>
  )
}
```

## Zona Horaria
- **Estándar:** es-PY (Spanish - Paraguay)
- **UTC:** No se interpreta como UTC - siempre zona local
- **Caso:** Ada Noemi Brizuela 28/08/1988 ahora muestra correctamente en todos lados

## Historial
- **Razón creada:** Problemas con UTC timezone offset mostrando fechas 1 día anterior
- **Solución:** Parseo seguro que crea Date con componentes en lugar de string ISO
- **Beneficio:** Mismo comportamiento en Show, Index y Edit views
