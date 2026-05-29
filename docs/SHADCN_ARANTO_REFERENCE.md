# shadcn/ui - Aranto Component Reference

## Actualiza estos componentes

### Button Component

**ANTES:**
```
bg-sky-600 dark:bg-sky-500
hover:bg-sky-700 dark:hover:bg-sky-400
focus:ring-sky-500/50
```

**DESPUÉS:**
```
bg-emerald-600 dark:bg-emerald-500
hover:bg-emerald-700 dark:hover:bg-emerald-400
focus:ring-emerald-500/50 dark:focus:ring-emerald-400/40
```

---

### Card Component

**ANTES:**
```
bg-slate-50 dark:bg-slate-950
border-slate-200 dark:border-slate-800
```

**DESPUÉS:**
```
bg-white dark:bg-gradient-to-r dark:from-emerald-900/30 dark:to-[#1a2529]/60
border-emerald-200/70 dark:border-emerald-700/30
text-emerald-900 dark:text-white
```

---

### Input Component

**ANTES:**
```
border-slate-300 dark:border-slate-700
focus:ring-sky-500
dark:bg-slate-900
```

**DESPUÉS:**
```
border-emerald-300 dark:border-emerald-700/50
focus:ring-emerald-500/50 dark:focus:ring-emerald-400/40
dark:bg-emerald-900/20
text-emerald-900 dark:text-white
placeholder:text-emerald-500
```

---

### Select Component

**Content:**
```
dark:bg-[#1a2529]
border dark:border-emerald-700/30
```

**Items:**
```
hover:bg-emerald-100 dark:hover:bg-emerald-900/30
focus:bg-emerald-50 dark:focus:bg-emerald-500/10
```

---

### Dialog Component

**Content:**
```
dark:bg-[#1a2529]
border-emerald-200/70 dark:border-emerald-700/30
```

---

### Table Component

**Header:**
```
bg-emerald-50 dark:bg-emerald-900/30
border-emerald-200/70 dark:border-emerald-700/30
```

**Rows:**
```
hover:bg-emerald-50 dark:hover:bg-emerald-900/20
border-emerald-200/70 dark:border-emerald-700/30
```

---

### Tabs Component

**TabsList:**
```
bg-emerald-100 dark:bg-emerald-900/30
border-emerald-200/70 dark:border-emerald-700/30
```

**TabsTrigger (active):**
```
data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-800/60
data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400
```

---

## Checklist de Validación

- [ ] Button se ve en light mode
- [ ] Button se ve en dark mode
- [ ] Card se ve en light mode
- [ ] Card se ve en dark mode
- [ ] Input border es emerald
- [ ] Select hover es emerald
- [ ] Dialog background es correcto
- [ ] Table header es emerald
- [ ] Tabs active es emerald
- [ ] NO hay colores sky-blue
- [ ] Focus rings son emerald
- [ ] Transiciones son smooth

---

**Usa COPILOT_DESIGN_PROMPT.md para clases exactas.**
