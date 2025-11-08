# Ejemplo del Sistema de Precios por Seguro Médico

**Fecha**: 7 de noviembre de 2025

## Estructura de Datos en Acción

### Ejemplo 1: Consulta General con múltiples seguros

```sql
-- Servicio: Consulta General
INSERT INTO medical_services (id, name, code, category_id, status) 
VALUES (1, 'Consulta General', 'CONS_GEN', 1, 'active');

-- Tipos de Seguro
INSERT INTO insurance_types (id, name, code, status) VALUES 
(1, 'Particular', 'PARTICULAR', 'active'),
(2, 'Unimed', 'UNIMED', 'active'),
(3, 'OSDE', 'OSDE', 'active'),
(4, 'Swiss Medical', 'SWISS', 'active');

-- Precios por seguro (tabla pivot service_prices)
INSERT INTO service_prices (service_id, insurance_type_id, price, effective_from) VALUES 
(1, 1, 150000.00, '2025-01-01'), -- Particular: ₲ 150.000
(1, 2, 180000.00, '2025-01-01'), -- Unimed: ₲ 180.000
(1, 3, 200000.00, '2025-01-01'), -- OSDE: ₲ 200.000
(1, 4, 190000.00, '2025-01-01'); -- Swiss Medical: ₲ 190.000
```

### Ejemplo 2: Paciente con Unimed solicita Consulta General

```php
// 1. Paciente registrado con Unimed
$patient = new Patient([
    'first_name' => 'Juan',
    'last_name' => 'Pérez',
    'document_type' => 'CI',
    'document_number' => '12345678',
    'insurance_type_id' => 2, // Unimed
    'insurance_number' => 'UN-789456'
]);

// 2. En Recepción: Se crea solicitud de servicio
$serviceRequest = new ServiceRequest([
    'patient_id' => $patient->id,
    'service_id' => 1, // Consulta General
    'professional_id' => 5, // Dr. García
    'requested_date' => '2025-11-07',
    'status' => 'pending_payment'
]);

// 3. En Caja: Se busca el precio vigente
$pricing = new PricingService();
$price = $pricing->getPriceForService(
    serviceId: 1,        // Consulta General
    insuranceTypeId: 2,  // Unimed
    date: '2025-11-07'
);
// Resultado: ₲ 180.000

// 4. Se procesa el cobro
$movement = new Movement([
    'cash_register_id' => $activeRegister->id,
    'type' => 'INCOME',
    'category' => 'SERVICE_PAYMENT',
    'amount' => $price->price, // 180000.00
    'patient_id' => $patient->id,
    'professional_id' => $serviceRequest->professional_id
]);

// 5. Detalle del movimiento con referencia al servicio
$movementDetail = new MovementDetail([
    'movement_id' => $movement->id,
    'service_id' => 1,
    'service_request_id' => $serviceRequest->id,
    'concept' => 'Consulta General - Dr. García',
    'cantidad' => 1,
    'precio_unitario' => $price->price,
    'total' => $price->price
]);
```

### Ejemplo 3: Liquidación de Comisión

```php
// Professional: Dr. García con 70% de comisión
$professional = new Professional([
    'first_name' => 'Carlos',
    'last_name' => 'García',
    'commission_percentage' => 70.00,
    'status' => 'active'
]);

// Cálculo automático de comisión
$commissionService = new CommissionService();
$commission = $commissionService->calculateCommission(
    professionalId: 5,
    serviceId: 1,
    serviceAmount: 180000.00
);

// Resultado: 
// commission_amount = 180000 * 70% = ₲ 126.000
// remaining_for_clinic = 180000 - 126000 = ₲ 54.000
```

## Frontend: Componente ServicePriceManager

```typescript
// resources/js/Components/Services/ServicePriceManager.tsx
interface ServicePrice {
    id: number;
    service_id: number;
    insurance_type_id: number;
    insurance_type: InsuranceType;
    price: number;
    effective_from: string;
    effective_until?: string;
}

export const ServicePriceManager = ({ serviceId }: { serviceId: number }) => {
    const [prices, setPrices] = useState<ServicePrice[]>([]);
    const [insuranceTypes] = useInsuranceTypes();

    // Mostrar tabla de precios por seguro
    return (
        <div className="space-y-4">
            <h3>Precios por Tipo de Seguro</h3>
            
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tipo de Seguro</TableHead>
                        <TableHead>Precio Vigente</TableHead>
                        <TableHead>Vigencia Desde</TableHead>
                        <TableHead>Vigencia Hasta</TableHead>
                        <TableHead>Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {prices.map((price) => (
                        <TableRow key={price.id}>
                            <TableCell>{price.insurance_type.name}</TableCell>
                            <TableCell className="font-mono">
                                {formatCurrency(price.price)}
                            </TableCell>
                            <TableCell>{price.effective_from}</TableCell>
                            <TableCell>
                                {price.effective_until || 'Indefinido'}
                            </TableCell>
                            <TableCell>
                                <Button onClick={() => editPrice(price)}>
                                    Editar
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Button onClick={addNewPrice}>
                Agregar Nuevo Precio
            </Button>
        </div>
    );
};
```

## Sistema de Validaciones

### 1. Validación de Períodos Sin Solapamiento

```php
// En ServicePriceRequest.php
public function rules(): array
{
    return [
        'service_id' => 'required|exists:medical_services,id',
        'insurance_type_id' => 'required|exists:insurance_types,id',
        'price' => 'required|numeric|min:0',
        'effective_from' => 'required|date',
        'effective_until' => 'nullable|date|after:effective_from',
    ];
}

public function withValidator($validator)
{
    $validator->after(function ($validator) {
        $this->validateNoOverlappingPeriods($validator);
    });
}

private function validateNoOverlappingPeriods($validator)
{
    $overlapping = ServicePrice::where('service_id', $this->service_id)
        ->where('insurance_type_id', $this->insurance_type_id)
        ->where('id', '!=', $this->route('price'))
        ->where(function ($query) {
            $query->whereBetween('effective_from', [$this->effective_from, $this->effective_until])
                  ->orWhereBetween('effective_until', [$this->effective_from, $this->effective_until])
                  ->orWhere(function ($q) {
                      $q->where('effective_from', '<=', $this->effective_from)
                        ->where('effective_until', '>=', $this->effective_until);
                  });
        })
        ->exists();

    if ($overlapping) {
        $validator->errors()->add('effective_from', 
            'Este período se solapa con un precio existente para esta combinación servicio-seguro.'
        );
    }
}
```

### 2. Validación de Precio Vigente

```php
// En PricingService.php
public function getPriceForService(int $serviceId, int $insuranceTypeId, ?string $date = null): ?ServicePrice
{
    $date = $date ?? now()->toDateString();
    
    $price = ServicePrice::where('service_id', $serviceId)
        ->where('insurance_type_id', $insuranceTypeId)
        ->where('effective_from', '<=', $date)
        ->where(function($query) use ($date) {
            $query->whereNull('effective_until')
                  ->orWhere('effective_until', '>=', $date);
        })
        ->orderBy('effective_from', 'desc')
        ->first();

    if (!$price) {
        throw new PriceNotFoundException(
            "No se encontró precio vigente para el servicio {$serviceId} y seguro {$insuranceTypeId} en la fecha {$date}"
        );
    }

    return $price;
}
```

## Ejemplo de Flujo Completo

### Escenario: Paciente llega a cobrar servicios

```typescript
// 1. Búsqueda de paciente en frontend
const PatientSearch = () => {
    const searchPatient = async (document: string) => {
        const patient = await api.get(`/patients/search/${document}`);
        // Trae datos completos incluyendo insurance_type
        return patient;
    };
};

// 2. Obtención de servicios pendientes
const PendingServices = ({ patientId }: { patientId: number }) => {
    const { data: pendingServices } = useQuery({
        queryKey: ['pending-services', patientId],
        queryFn: () => api.get(`/patients/${patientId}/pending-services`)
        // Retorna servicios con precios calculados según seguro del paciente
    });

    return (
        <div className="space-y-2">
            {pendingServices.map(service => (
                <div key={service.id} className="flex justify-between p-3 border rounded">
                    <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">
                            Dr. {service.professional_name}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">
                            {formatCurrency(service.calculated_price)}
                        </p>
                        <p className="text-xs text-gray-500">
                            {service.insurance_type_name}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};
```

## Beneficios de esta Arquitectura

✅ **Flexibilidad Total**: Cada servicio puede tener precios diferentes por seguro
✅ **Historicidad**: Se mantiene historial completo de precios
✅ **Escalabilidad**: Fácil agregar nuevos seguros y servicios
✅ **Validaciones Robustas**: Evita solapamientos y gaps en precios
✅ **Trazabilidad Completa**: Cada cobro referencia el precio exacto usado
✅ **Comisiones Automáticas**: Cálculo automático basado en configuración del profesional
✅ **Integración Seamless**: Frontend y backend trabajando con la misma estructura