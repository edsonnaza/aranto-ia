# Sistema Global de Currency - Guía de Uso

## 🎯 Objetivo
Sistema integrado para manejo automático de currency Paraguay Guaraní (₲) entre base de datos, backend PHP y frontend React/TypeScript.

## 🔧 Componentes del Sistema

### 1. **Helpers Globales PHP** (`app/helpers.php`)

```php
// Formateo para mostrar al usuario
format_currency(3000000)      // "₲ 3.000.000"
format_currency(3000000.50)   // "₲ 3.000.000,50"

// Formateo para inputs/formularios
currency_input(3000000)       // "3.000.000"
currency_input(3000000.50)    // "3.000.000,50"

// Parsing desde strings formateados
parse_currency("₲ 3.000.000,50")  // 3000000.5

// Validación
validate_currency("3.000.000,50")  // true
```

### 2. **Currency Cast Eloquent** (`app/Casts/CurrencyCast.php`)

Conversión automática en modelos:

```php
// En tus modelos
protected $casts = [
    'amount' => CurrencyCast::class,
    'initial_amount' => CurrencyCast::class,
];

// Uso automático
$session = new CashRegisterSession();
$session->initial_amount = "₲ 3.000.000,50";  // Se convierte automáticamente
echo $session->initial_amount;  // 3000000.5 (float)
```

### 3. **Trait HasCurrencyHelpers** (`app/Traits/HasCurrencyHelpers.php`)

Métodos automáticos para modelos:

```php
// En tu modelo
class CashRegisterSession extends Model {
    use HasCurrencyHelpers;
}

// Uso
$session = CashRegisterSession::find(1);
echo $session->initial_amount_formatted;  // "₲ 3.000.000,50"
echo $session->initial_amount_input;      // "3.000.000,50"
```

### 4. **Servicio Frontend** (`resources/js/services/currency.ts`)

```typescript
import { formatCurrency, parseCurrency } from '@/services/currency';

// Formateo
formatCurrency(3000000)      // "₲ 3.000.000"
formatCurrency(3000000.50)   // "₲ 3.000.000,50"

// Parsing
parseCurrency("₲ 3.000.000,50")  // 3000000.5
```

## 🚀 Casos de Uso

### Caso 1: Recibir datos del backend
```typescript
// El backend envía: { amount: 3000000.5 }
const formattedAmount = formatCurrency(data.amount);
// Resultado: "₲ 3.000.000,50"
```

### Caso 2: Enviar datos al backend
```typescript
// Usuario ingresa: "3.000.000,50"
const numericValue = parseCurrency(userInput);
// Enviar: { amount: 3000000.5 }
```

### Caso 3: Formularios automáticos
```typescript
// En React Hook Form
const { register } = useForm({
    transform: {
        amount: {
            input: (value) => currency_input(value),
            output: (value) => parseCurrency(value)
        }
    }
});
```

### Caso 4: Respuestas automáticas en controllers
```php
// El trait automáticamente agrega campos formateados
return response()->json([
    'session' => $session,
    // Automáticamente incluye:
    // initial_amount_formatted: "₲ 3.000.000,50"
    // initial_amount_input: "3.000.000,50"
]);
```

## ✅ Beneficios

1. **Conversión Automática**: Los modelos Eloquent convierten automáticamente entre formatos
2. **Consistencia Global**: Mismo formato en toda la aplicación
3. **Validación Integrada**: Validación automática de formatos
4. **Fácil Mantenimiento**: Un solo lugar para cambiar el formato
5. **Type Safety**: TypeScript completo en frontend

## 🎨 Formato Paraguay Guaraní

- **Símbolo**: ₲ (antes del monto)
- **Separador de miles**: . (punto)
- **Separador decimal**: , (coma)
- **Decimales inteligentes**: Solo si son necesarios

**Ejemplos:**
- `₲ 3.000.000` (sin decimales)
- `₲ 3.000.000,50` (con decimales)

## 🔄 Flujo Completo

```
Frontend Input: "3.000.000,50"
       ↓ parseCurrency()
Backend PHP: 3000000.5
       ↓ CurrencyCast
Database: 3000000.50 (DECIMAL)
       ↓ CurrencyCast  
Backend Response: 3000000.5
       ↓ HasCurrencyHelpers
API JSON: {
    "amount": 3000000.5,
    "amount_formatted": "₲ 3.000.000,50",
    "amount_input": "3.000.000,50"
}
       ↓ formatCurrency()
Frontend Display: "₲ 3.000.000,50"
```

## 📝 Configuración Requerida

1. ✅ Helpers cargados en `composer.json`
2. ✅ Modelos usando `CurrencyCast`
3. ✅ Modelos usando `HasCurrencyHelpers` trait
4. ✅ Frontend importando servicios currency

¡El sistema está listo para uso en producción! 🎉