# Aranto Refactor Guide - Guía Completa

## 🎯 Objetivo

Refactorizar tu proyecto Laravel 12 + React/Inertia para usar la paleta de colores Aranto (Sistema Médico Integral).

---

## 1. CONFIGURACIÓN CORE - TAILWIND

Actualiza `tailwind.config.js` con estos colores:

```javascript
theme: {
  extend: {
    colors: {
      emerald: {
        50: '#f0f7f5',
        100: '#d4e8e3',
        200: '#a8d1c7',
        300: '#7cbaab',
        400: '#50a38f',
        500: '#34a853',
        600: '#2a8a45',
        700: '#1e3034',
        800: '#1a2a2e',
        900: '#0f1a1e',
      },
    },
  },
}
```

---

## 2. ARCHIVOS A ACTUALIZAR

### Críticos (haz primero):
1. `tailwind.config.js` - Agregar colores
2. `resources/styles/globals.css` - Crear con variables CSS
3. `resources/js/components/layout/AppLayout.tsx` - Actualizar
4. `resources/js/components/ui/button.tsx` - Emerald
5. `resources/js/components/ui/card.tsx` - Emerald
6. `resources/js/components/ui/input.tsx` - Emerald
7. `resources/js/components/ui/select.tsx` - Emerald

### Secundarios:
8. `resources/js/components/ui/dialog.tsx`
9. `resources/js/components/ui/table.tsx`
10. `resources/js/components/ui/tabs.tsx`

---

## 3. CLASES TAILWIND PRINCIPALES

```
Light mode:
- bg-white
- text-emerald-900
- border-emerald-200/70
- hover:border-emerald-300

Dark mode:
- dark:bg-[#0f1a1e]
- dark:text-white
- dark:border-emerald-700/30
- dark:hover:border-emerald-600/50

Buttons:
- bg-emerald-600 hover:bg-emerald-700
- dark:bg-emerald-500 dark:hover:bg-emerald-400

Focus:
- focus:ring-emerald-500/50
- dark:focus:ring-emerald-400/40
```

---

## 4. ESTRATEGIA DE 5 FASES

| Fase | Duración | Qué Hacer |
|------|----------|-----------|
| 1 | 30 min | Setup: Tailwind + CSS + Layout |
| 2 | 2 h | Components: button, card, input, select |
| 3 | 1 h | Componentes: dialog, table, tabs |
| 4 | 1 h | Comunes: EmptyState, Alert, Badge |
| 5 | 2-3 h | Páginas: Dashboard, Patients, Admin, etc |

---

## 5. VALIDACIÓN EN CADA FASE

Después de cada fase:

```bash
npm run build        # Debe compilar OK
# Abre en navegador  # Verifica light mode
# Activa dark mode   # Verifica dark mode
```

Busca:
- ✅ No hay colores sky-blue (#0ea5e9)
- ✅ Borders son emerald
- ✅ Texto es readable
- ✅ Transiciones son suaves

---

## 6. COMPONENTES COMUNES A CREAR

```typescript
// EmptyState.tsx
- Icon con bg-emerald-100
- Title text-emerald-700
- Description text-emerald-600

// Alert.tsx
- Variantes: info, success, warning, error
- Success/Info: emerald
- Warning: orange
- Error: red

// Badge.tsx
- Variantes: primary, orange, red, teal
- Primary: bg-emerald-100 border-emerald-300

// LoadingSpinner.tsx
- Icono Loader2 de lucide-react
- Color: text-emerald-500
```

---

## 7. REFERENCIA RÁPIDA

```
COLORES:
Primary:     #34A853
Dark BG:     #0f1a1e
Light BG:    #ffffff
Borders L:   emerald-200/70
Borders D:   emerald-700/30
Focus:       emerald-500/50
Warning:     #f97316
Error:       #ef4444

CLASES USADAS:
- rounded-lg (inputs)
- rounded-xl (cards)
- p-3 a p-4 (padding compacto)
- transition-all duration-200 (suave)
```

---

## 8. COMANDOS PARA COPILOT

### Intro:
```
Necesito refactorizar mi proyecto Laravel 12 + React/Inertia a Aranto.
Lee COPILOT_DESIGN_PROMPT.md para la paleta completa.
```

### Fase 1:
```
Actualiza tailwind.config.js con colores Aranto (ver ARANTO_REFACTOR_GUIDE.md)
Crea resources/styles/globals.css con variables CSS
Actualiza AppLayout.tsx para usar colores emerald
```

### Fase 2-5:
```
Actualiza [componente].tsx para Aranto (ver SHADCN_ARANTO_REFERENCE.md)
Usa colores emerald en lugar de sky-blue
Mantén dark: prefixes en todas las clases
```

---

**¡Listo! Abre COMANDOS_COPILOT.md para los comandos exactos.**
