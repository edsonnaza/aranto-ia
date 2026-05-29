# Comandos para Copilot - Aranto Refactor

## COMANDO 0: Introducción (Copia y pega esto)

```
Hola Copilot, necesito refactorizar mi proyecto Laravel 12 + React/Inertia 
a la paleta de colores Aranto (Sistema Médico Integral).

DOCUMENTOS DE REFERENCIA:
1. ARANTO_REFACTOR_GUIDE.md - Estrategia
2. COPILOT_DESIGN_PROMPT.md - Clases Tailwind
3. SHADCN_ARANTO_REFERENCE.md - Componentes

PALETA ARANTO:
- Primary: #34A853 (Emerald Green)
- Dark BG: #0f1a1e
- Light BG: #ffffff
- Borders: emerald-200/70 (light) | emerald-700/30 (dark)

¿LISTO PARA COMENZAR?
```

---

## FASE 1: Setup Core (30 minutos)

### COMANDO 1.1: Actualizar Tailwind

```
Actualiza tailwind.config.js:

Agrega en theme.extend.colors:
- emerald: { 50: '#f0f7f5', 100: '#d4e8e3', ... 900: '#0f1a1e' }
  (Ver ARANTO_REFACTOR_GUIDE.md Sección 1)

Agrega en theme.extend.backgroundColor:
- 'dark-primary': '#0f1a1e'
- 'dark-secondary': '#151f23'
- 'dark-tertiary': '#1a2529'

Verifica que compila: npm run build
```

### COMANDO 1.2: Crear CSS Global

```
Crea resources/styles/globals.css con:

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #34a853;
  --bg-primary: #ffffff;
  --text-primary: #1e3034;
  --border-default: rgba(200, 210, 216, 0.8);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f1a1e;
    --text-primary: #ffffff;
    --border-default: rgba(52, 77, 85, 0.4);
  }
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

### COMANDO 1.3: Actualizar AppLayout

```
Actualiza resources/js/components/layout/AppLayout.tsx:

Root: className="min-h-screen bg-white dark:bg-[#0f1a1e]"
Header: className="border-b border-emerald-200/70 dark:border-emerald-700/30"
Main: className="flex-1 p-6"
Título: className="text-2xl font-bold text-emerald-900 dark:text-white"
Texto: className="text-sm text-emerald-700 dark:text-emerald-400"

Verifica: npm run build
```

---

## FASE 2: Components Base (2 horas)

### COMANDO 2.1: Button

```
Actualiza resources/js/components/ui/button.tsx

Reemplaza TODAS las referencias a sky-blue:
- bg-sky-600 → bg-emerald-600
- dark:bg-sky-500 → dark:bg-emerald-500
- hover:bg-sky-700 → hover:bg-emerald-700
- focus:ring-sky-500/50 → focus:ring-emerald-500/50

Ver SHADCN_ARANTO_REFERENCE.md - Button Component para código completo
```

### COMANDO 2.2: Card

```
Actualiza resources/js/components/ui/card.tsx

Card component:
  className="bg-white dark:bg-gradient-to-r dark:from-emerald-900/30 dark:to-[#1a2529]/60 
             border border-emerald-200/70 dark:border-emerald-700/30 rounded-xl p-4"

CardTitle:
  className="text-emerald-900 dark:text-white"

CardDescription:
  className="text-emerald-600 dark:text-emerald-400"

Ver SHADCN_ARANTO_REFERENCE.md - Card Component
```

### COMANDO 2.3: Input

```
Actualiza resources/js/components/ui/input.tsx

Input className:
  "flex h-10 w-full rounded-lg border border-emerald-300 dark:border-emerald-700/50
   bg-white dark:bg-emerald-900/20 px-3 py-2
   text-emerald-900 dark:text-white
   placeholder:text-emerald-500 dark:placeholder:text-emerald-600
   focus:outline-none focus:ring-2 focus:ring-emerald-500/50
   disabled:cursor-not-allowed disabled:opacity-50
   transition-all duration-200"

Ver SHADCN_ARANTO_REFERENCE.md - Input Component
```

### COMANDO 2.4: Select

```
Actualiza resources/js/components/ui/select.tsx

SelectContent:
  className="bg-white dark:bg-[#1a2529]
             border border-emerald-200/70 dark:border-emerald-700/30"

SelectItem:
  className="hover:bg-emerald-100 dark:hover:bg-emerald-900/30
             focus:bg-emerald-50 dark:focus:bg-emerald-500/10"

ItemIndicator checkmark:
  className="text-emerald-600 dark:text-emerald-400"

Ver SHADCN_ARANTO_REFERENCE.md - Select Component
```

---

## FASE 3: Components Secundarios (1 hora)

### COMANDO 3.1: Dialog

```
Actualiza resources/js/components/ui/dialog.tsx

DialogContent:
  className="dark:bg-[#1a2529] dark:border-emerald-700/30"

Close button focus:
  focus:ring-emerald-500 dark:focus:ring-emerald-400

Ver SHADCN_ARANTO_REFERENCE.md - Dialog Component
```

### COMANDO 3.2: Table

```
Actualiza resources/js/components/ui/table.tsx

TableHeader:
  className="bg-emerald-50 dark:bg-emerald-900/30
             border-b border-emerald-200/70 dark:border-emerald-700/30"

TableRow:
  className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20
             border-b border-emerald-200/70 dark:border-emerald-700/30"

Ver SHADCN_ARANTO_REFERENCE.md - Table Component
```

### COMANDO 3.3: Tabs

```
Actualiza resources/js/components/ui/tabs.tsx

TabsList:
  className="bg-emerald-100 dark:bg-emerald-900/30
             border border-emerald-200/70 dark:border-emerald-700/30"

TabsTrigger:
  className="data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-800/60
             data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"

Ver SHADCN_ARANTO_REFERENCE.md - Tabs Component
```

---

## FASE 4: Components Comunes (1 hora)

### COMANDO 4.1: Crear EmptyState

```
Crea resources/js/components/common/EmptyState.tsx

Props: icon, title, description, action, className

Icon container:
  className="bg-emerald-100 dark:bg-emerald-800/60 border border-emerald-200"

Title:
  className="text-emerald-700 dark:text-emerald-300"

Description:
  className="text-emerald-600 dark:text-emerald-600"

Ver COPILOT_DESIGN_PROMPT.md para código completo
```

### COMANDO 4.2: Crear Alert

```
Crea resources/js/components/common/Alert.tsx

Variantes: info, success, warning, error

Success/Info: bg-emerald-50 dark:bg-emerald-500/10
Warning: bg-orange-50 dark:bg-orange-500/10
Error: bg-red-50 dark:bg-red-500/10

Ver COPILOT_DESIGN_PROMPT.md para código completo
```

### COMANDO 4.3: Crear Badge

```
Crea resources/js/components/common/Badge.tsx

Variantes: primary, orange, red, teal

Primary: bg-emerald-100 dark:bg-emerald-500/15
         border-emerald-300 dark:border-emerald-500/40
         text-emerald-700 dark:text-emerald-400

Ver COPILOT_DESIGN_PROMPT.md para código completo
```

### COMANDO 4.4: Crear LoadingSpinner

```
Crea resources/js/components/common/LoadingSpinner.tsx

Icono Loader2 de lucide-react
Color: text-emerald-500
Tamaños: sm (w-4 h-4), md (w-6 h-6), lg (w-8 h-8)
Animación: animate-spin

Ver COPILOT_DESIGN_PROMPT.md para código completo
```

---

## FASE 5: Refactor de Páginas (2-3 horas)

### COMANDO 5.1: Dashboard

```
Refactoriza resources/js/pages/Dashboard/index.tsx

Layout:
  className="min-h-screen bg-white dark:bg-[#0f1a1e] p-6"

Cards:
  className="bg-white dark:bg-gradient-to-r dark:from-emerald-900/30 dark:to-[#1a2529]/60
             border border-emerald-200/70 dark:border-emerald-700/30 rounded-xl p-4"

Buttons:
  Primary: bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500
  Secondary: bg-slate-100 dark:bg-emerald-900/30

Badges:
  Success: bg-emerald-100 dark:bg-emerald-500/15
  Warning: bg-orange-100 dark:bg-orange-500/15
  Error: bg-red-100 dark:bg-red-500/15

Valida en light + dark mode
```

### COMANDO 5.X: [Página]

```
Repite lo mismo que Dashboard para:
- Patients/Consultations
- Admin Panel
- Settings
- Reports
- ... todas las demás páginas

Usa las mismas clases en todas.
```

---

## VALIDACIÓN FINAL

```
Ejecuta:
npm run build

Verifica:
✅ No hay errores de compilación
✅ Light mode se ve bien
✅ Dark mode se ve bien
✅ NO hay colores sky-blue
✅ Borders son emerald
✅ Botones son emerald
✅ Focus rings son emerald
✅ Texto es readable
✅ Transiciones son suaves

¡REFACTOR COMPLETO!
```

---

**¿Listo? Empieza con COMANDO 0.**
