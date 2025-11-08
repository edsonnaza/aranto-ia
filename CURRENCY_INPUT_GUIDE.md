# CurrencyInput - Componente Global de Input con Formateo

## 🎯 Características

- ✅ **Formateo en tiempo real**: `6000000` → `6.000.000`
- ✅ **Paraguay Guaraní**: Formato con puntos para miles, coma para decimales
- ✅ **Validación automática**: Solo números válidos
- ✅ **Prefijo opcional**: Mostrar ₲ automáticamente
- ✅ **Control de Min/Max**: Límites configurables
- ✅ **Integración React Hook Form**: Hook personalizado
- ✅ **Accesibilidad**: Completamente accesible

## 🚀 Uso Básico

```tsx
import { CurrencyInput } from '@/components/ui/currency-input';

function MyComponent() {
  const [amount, setAmount] = useState<number>(0);

  return (
    <CurrencyInput
      value={amount}
      onChange={setAmount}
      placeholder="Ingrese el monto"
      showPrefix={true}
    />
  );
}
```

## 📝 Props Disponibles

```tsx
interface CurrencyInputProps {
  value?: number | string | null;
  onChange?: (value: number) => void;
  onRawChange?: (rawValue: string) => void;
  placeholder?: string;
  allowNegative?: boolean;
  maxValue?: number;
  minValue?: number;
  prefix?: string;
  showPrefix?: boolean;
  error?: string | boolean;
  disabled?: boolean;
  className?: string;
}
```

## 🎨 Ejemplos de Uso

### 1. Input básico con formateo
```tsx
<CurrencyInput 
  value={6000000}
  onChange={setAmount}
  placeholder="0"
/>
// Muestra: "6.000.000"
```

### 2. Con prefijo Paraguay Guaraní
```tsx
<CurrencyInput 
  value={3000000.50}
  onChange={setAmount}
  showPrefix={true}
  placeholder="0"
/>
// Muestra: "₲ 3.000.000,50"
```

### 3. Con validaciones
```tsx
<CurrencyInput 
  value={amount}
  onChange={setAmount}
  minValue={1000}
  maxValue={10000000}
  error={error}
/>
```

### 4. Con React Hook Form
```tsx
import { useCurrencyInput } from '@/hooks/use-currency-input';

function FormExample() {
  const { control } = useForm();
  
  const { field, fieldState } = useCurrencyInput({
    name: "amount",
    control,
    rules: { required: "Amount is required" }
  });

  return (
    <CurrencyInput 
      {...field} 
      error={fieldState.error?.message}
      showPrefix={true}
    />
  );
}
```

## ⚡ Comportamiento

### Formateo Inteligente
- **Sin decimales**: `3000000` → `3.000.000`
- **Con decimales**: `3000000.50` → `3.000.000,50`
- **Entrada incremental**: `6` → `60` → `600` → `6.000` → `60.000`

### Validaciones Automáticas
- Solo números, puntos y comas
- Máximo una coma decimal
- Respeta min/max values
- Previene números negativos (opcional)

### Eventos de Teclado
- ✅ Backspace, Delete, Tab, Enter, Escape
- ✅ Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
- ✅ Flechas de navegación
- ❌ Letras y caracteres especiales

## 🎯 Integración Completa

### En Modales
```tsx
// OpenCashModal.tsx - YA IMPLEMENTADO
<CurrencyInput
  value={initialAmount}
  onChange={setInitialAmount}
  showPrefix={true}
  minValue={0}
  placeholder="0"
  error={errors.initial_amount}
/>
```

### Con Formularios
```tsx
const { control } = useForm({
  defaultValues: { amount: 0 }
});

const { field, fieldState } = useCurrencyInput({
  name: "amount",
  control,
  minValue: 0,
  maxValue: 1000000000
});

return <CurrencyInput {...field} error={fieldState.error?.message} />;
```

## ✨ Beneficios UX

1. **Visual Immediate**: El usuario ve `6.000.000` mientras escribe
2. **Claridad**: Fácil lectura de montos grandes
3. **Consistencia**: Formato Paraguay en toda la app
4. **Validación**: Error prevention en tiempo real
5. **Accesibilidad**: Screen reader friendly

## 🔗 Archivos Relacionados

- `components/ui/currency-input.tsx` - Componente principal
- `hooks/use-currency-input.ts` - Hook para React Hook Form
- `services/currency.ts` - Servicios de formateo
- `app/helpers.php` - Helpers backend para consistency

¡El input está listo para usar en toda la aplicación! 🎉