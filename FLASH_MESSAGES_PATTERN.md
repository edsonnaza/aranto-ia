# 🚨 Flash Messages Pattern - Aranto-ia

## ✅ **PATRÓN CORRECTO (Funciona)**

### **En Controlador Laravel:**

```php
// ✅ ÉXITO - Usar 'message'
return redirect()
    ->route('medical.modulo.index')
    ->with('message', 'Operación completada exitosamente.');

// ✅ ERROR - Usar 'error'  
return redirect()
    ->route('medical.modulo.index')
    ->with('error', 'No se pudo completar la operación.');
```

### **Ejemplo Completo en Controlador:**

```php
class ExampleController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:table'
        ]);

        Example::create($validated);

        return redirect()
            ->route('medical.examples.index')
            ->with('message', 'Ejemplo creado exitosamente.');
    }

    public function update(Request $request, Example $example): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('table')->ignore($example)]
        ]);

        $example->update($validated);

        return redirect()
            ->route('medical.examples.index')
            ->with('message', 'Ejemplo actualizado exitosamente.');
    }

    public function destroy(Example $example): RedirectResponse
    {
        // Verificar dependencias
        if ($example->relatedModels()->exists()) {
            return redirect()
                ->route('medical.examples.index')
                ->with('error', 'No se puede eliminar porque tiene registros relacionados.');
        }

        $example->delete();

        return redirect()
            ->route('medical.examples.index')
            ->with('message', 'Ejemplo eliminado exitosamente.');
    }
}
```

---

## 🔧 **FlashMessageProvider Configuración**

El `FlashMessageProvider` está configurado para detectar:

```typescript
// En FlashMessageProvider.tsx
const { message, error } = props as { 
    message?: string; 
    error?: string; 
};

useEffect(() => {
    // Éxito
    if (message && message !== lastMessage.current) {
        toast.success(message);
        lastMessage.current = message;
    }
    
    // Error
    if (error && error !== lastError.current) {
        toast.error(error);
        lastError.current = error;
    }
}, [message, error]);
```

---

## ❌ **PATRONES INCORRECTOS (No usar)**

```php
// ❌ NO USAR - Format flash array
return redirect()->with('flash', [
    'success' => 'mensaje'
]);

// ❌ NO USAR - Format success key
return redirect()->with('success', 'mensaje');

// ❌ NO USAR - Toast manual en controlador
return redirect()->with('toast', [
    'type' => 'success',
    'message' => 'mensaje'
]);
```

---

## 🎯 **Uso en Frontend**

### **Automático (Recomendado):**
Los toasts aparecen automáticamente cuando el controlador hace redirect con `message` o `error`.

### **Manual (Si necesario):**
```tsx
import { toast } from 'sonner'

// En callbacks de formulario
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    post('/medical/examples', {
        preserveScroll: true,
        onSuccess: () => {
            // ✅ Toast manual si necesario (el automático ya funciona)
            toast.success('Creado correctamente')
        },
        onError: () => {
            // ✅ Toast de error por validaciones del cliente
            toast.error('Error en el formulario')
        },
    })
}
```

---

## 🧪 **Testing del Patrón**

### **Para verificar que funciona:**

1. **Crear registro**: Debería mostrar toast verde de éxito
2. **Editar registro**: Debería mostrar toast verde de actualización
3. **Eliminar registro**: Debería mostrar toast verde de eliminación
4. **Error de validación**: Debería mostrar toast rojo de error
5. **Error de dependencias**: Debería mostrar toast rojo con mensaje específico

### **Debugging:**
```php
// Agregar en controlador para debug
\Log::info('Flash message sent:', ['message' => 'texto del mensaje']);

// En FlashMessageProvider activar logs (ya está)
console.log('FlashMessageProvider - Props received:', { message, error });
```

---

## 📋 **Checklist Flash Messages**

- [ ] Controlador usa `->with('message', 'texto')` para éxito
- [ ] Controlador usa `->with('error', 'texto')` para errores  
- [ ] FlashMessageProvider incluido en layout principal
- [ ] Sonner Toaster configurado en layout
- [ ] Toasts aparecen al crear/editar/eliminar
- [ ] Mensajes de error funcionan para validaciones
- [ ] No hay toasts duplicados

---

## ✅ **Controladores ya Configurados Correctamente**

- ✅ `ServiceCategoryController` - Patrón original que funciona
- ✅ `InsuranceTypeController` - Corregido para seguir patrón
- ✅ `PatientController` - Ya usaba el patrón correcto
- ✅ `ProfessionalController` - Corregido de 'success' a 'message'

---

*Este es el patrón oficial para Flash Messages en Aranto-ia. Seguir exactamente este formato para mantener consistencia.*