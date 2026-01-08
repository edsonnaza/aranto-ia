# Opciones de Mejora UX para Reception/Create

## Problema Actual
- Scroll horizontal obligatorio para ver todas las columnas
- Tabla muy ancha con columnas como Servicio (w-96), Profesional (w-48), Seguro (w-40)
- Difícil editar descuentos sin hacer scroll derecha
- Espacio desaprovechado en pantallas pequeñas

## Opciones de Mejora

### Opción 1: Vista Compacta en Tarjetas (Recomendada para Mobile)
```
Cambiar de tabla a vista de tarjetas en responsive:
- Desktop: Mantener tabla pero más compacta
- Tablet/Mobile: Cambiar a vista de tarjetas con expanding panels
```
**Ventajas:**
- ✅ No hay scroll horizontal
- ✅ Cada servicio es independiente
- ✅ Descuentos claros en cada tarjeta
- ✅ Mejor para mobile
- ❌ Menos densidad visual en desktop

### Opción 2: Tabla Simplificada + Modal Detallado
```
Tabla con columnas: Servicio | Cant. | Precio Unit. | Descuento | Total | Acciones
- Click en fila abre modal con todos los detalles
- Editar servicio, profesional, seguro, descuentos en modal
```
**Ventajas:**
- ✅ Tabla más compacta
- ✅ Detalles ocultos en modal
- ✅ No hay scroll horizontal
- ❌ Más clicks para editar
- ❌ Modal puede ser pesado

### Opción 3: Tabla Horizontal Scrollable Mejorada
```
- Reducir widths: Servicio (w-40), Profesional (w-32), Seguro (w-32)
- Reducir padding/fonts
- Congelar primera columna (Servicio)
- Scroll suave y claramente visible
```
**Ventajas:**
- ✅ Mantiene densidad visual
- ✅ Scroll predecible
- ✅ Menos cambios de código
- ❌ Aún hay scroll horizontal
- ❌ Primera columna congelada complica

### Opción 4: Diseño Híbrido (Mejor Balance)
```
- Desktop: Tabla reducida (Servicio col-1 | Profesional col-1 | Seguro col-1 | Precio | Descuento | Total)
- Searchable inputs inline pero más pequeños
- Expandible row para ver/editar profesional y seguro
- Descuentos en panel expandible
```
**Ventajas:**
- ✅ Compacta pero completa
- ✅ No hay scroll horizontal
- ✅ Expande solo lo necesario
- ✅ Buen balance funcionalidad/espacio
- ✅ Mejor UX

## Recomendación

**Opción 4 (Híbrido)** es la mejor:
1. Reducir tamaños de inputs de búsqueda
2. Tabla responsive:
   - Columnas principales: Servicio | Cant. | Precio | Descuento | Total
   - Profesional/Seguro en fila expandible
3. Row expandible para:
   - Seleccionar profesional
   - Seleccionar seguro
   - Editar descuentos

## Implementación por Pasos

1. Crear componente `ServiceCartRowExpanded` para filas expandibles
2. Reducir widths:
   - Servicio: w-full (flexible)
   - Profesional: w-28 o en expandible
   - Seguro: w-28 o en expandible
   - Precio: w-24
   - Descuento: botón "Editar"
   - Total: w-24
3. CSS para expandibles smooth
4. Mantener debounce y formato de moneda

## Mockup Mental

```
┌─────────────────────────────────────────────────────────────────┐
│ Servicio           │ Cant │ Precio   │ Desc. │ Total    │ Acc.  │
├─────────────────────────────────────────────────────────────────┤
│ Rx Cadera Ap       │  1   │ ₲100.000 │ Editar│ ₲100.000 │ ⋯ ↓  │
├─────────────────────────────────────────────────────────────────┤
│ Expandible Row: Profesional: [Buscar prof...] | Seguro: [...]   │
│ Descuentos: % [input] | ₲ [input]                                │
├─────────────────────────────────────────────────────────────────┤
│ Lab Hemo (Análisis) │ 1   │ ₲25.000  │ Editar│ ₲25.000  │ ⋯ ↓  │
├─────────────────────────────────────────────────────────────────┤
```

## Cambios en Archivos

### ServiceCartTable.tsx
- [ ] Crear estructura de expandible
- [ ] Reducir widths de inputs
- [ ] Separar profesional/seguro en fila expandible
- [ ] Botón "Editar Descuento" en lugar de panel siempre visible

### Create.tsx
- [ ] Ajustar grid si es necesario
- [ ] Revisar que la tabla nueva cabe en lg:col-span-2
