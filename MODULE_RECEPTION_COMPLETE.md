# Módulo de Recepción - Documentación Completa

**Creado**: 7 de noviembre de 2025
**Propósito**: Documentar el módulo de recepción como origen de las transacciones que se procesan en caja

## Flujo de Trabajo en Recepción

### 1. Llegada del Paciente
```
Paciente llega → Secretaria busca/registra → Confirma seguro → Agrega servicios → Asigna profesional → Genera "Service Request"
```

### 2. Interface de Usuario (Tipo Carrito de Compras)
```
┌─ BÚSQUEDA PACIENTE ─────────────────────────┐
│ [🔍 Buscar por CI, nombre...] [Nuevo Paciente] │
│ 👤 Juan Pérez - CI: 12345678               │
└─────────────────────────────────────────────┘

┌─ SEGURO MÉDICO ────────────────────────────┐
│ Seguro actual: 🏥 Unimed                  │
│ [Confirmar] [Cambiar Seguro]               │
└─────────────────────────────────────────────┘

┌─ SERVICIOS SOLICITADOS ────────────────────┐
│ [🔍 Buscar servicios...]                   │
│                                            │
│ 📋 CARRITO DE SERVICIOS:                   │
│ ┌────────────────────────────────────────┐ │
│ │ ✅ Consulta General                    │ │
│ │    👨‍⚕️ Dr. García - Medicina General   │ │
│ │    💰 ₲ 180.000 (Unimed)              │ │
│ │    📅 2025-11-07 14:30 [Cambiar]      │ │
│ │    [❌ Remover]                        │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ ✅ Electrocardiograma                  │ │
│ │    👨‍⚕️ Dr. López - Cardiología        │ │
│ │    💰 ₲ 250.000 (Unimed)              │ │
│ │    📅 2025-11-07 15:00 [Cambiar]      │ │
│ │    [❌ Remover]                        │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ [+ Agregar Otro Servicio]                 │
│                                            │
│ TOTAL: ₲ 430.000                          │
│ [💾 Registrar Solicitud]                   │
└─────────────────────────────────────────────┘
```

## Estructura de Base de Datos

### 1. Solicitudes de Servicio (service_requests)
```sql
CREATE TABLE service_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Referencias principales
    patient_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL, -- Usuario de recepción que creó
    
    -- Información de la solicitud
    request_number VARCHAR(20) UNIQUE NOT NULL, -- Ej: REQ-2025-001234
    request_date DATE NOT NULL,
    request_time TIME,
    
    -- Estado del proceso
    status ENUM('pending_confirmation', 'confirmed', 'in_progress', 'pending_payment', 'paid', 'cancelled') DEFAULT 'pending_confirmation',
    
    -- Tipo de recepción
    reception_type ENUM('scheduled', 'walk_in', 'emergency', 'inpatient_discharge') NOT NULL,
    
    -- Observaciones
    notes TEXT,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Control de pago
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0.00,
    payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    
    -- Timestamps
    confirmed_at DATETIME,
    cancelled_at DATETIME,
    cancelled_by BIGINT,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (cancelled_by) REFERENCES users(id),
    
    INDEX idx_patient (patient_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_request_date (request_date),
    INDEX idx_reception_type (reception_type),
    UNIQUE INDEX idx_request_number (request_number)
);
```

### 2. Detalles de Servicios Solicitados (service_request_details)
```sql
CREATE TABLE service_request_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_request_id BIGINT NOT NULL,
    
    -- Servicio específico
    medical_service_id BIGINT NOT NULL,
    professional_id BIGINT NOT NULL,
    
    -- Programación
    scheduled_date DATE,
    scheduled_time TIME,
    estimated_duration INT DEFAULT 30, -- minutos
    
    -- Pricing calculado en el momento
    insurance_type_id BIGINT NOT NULL, -- Del paciente, pero puede cambiar
    unit_price DECIMAL(10,2) NOT NULL, -- Precio vigente al momento de crear
    quantity INT DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL, -- unit_price * quantity
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL, -- subtotal - discount_amount
    
    -- Estado específico de este servicio
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    
    -- Vinculación con pago (cuando se cobra)
    movement_detail_id BIGINT, -- Se llena cuando se cobra en caja
    paid_at DATETIME,
    
    -- Observaciones específicas
    preparation_instructions TEXT,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (medical_service_id) REFERENCES medical_services(id),
    FOREIGN KEY (professional_id) REFERENCES professionals(id),
    FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id),
    FOREIGN KEY (movement_detail_id) REFERENCES movement_details(id),
    
    INDEX idx_service_request (service_request_id),
    INDEX idx_medical_service (medical_service_id),
    INDEX idx_professional (professional_id),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_status (status),
    INDEX idx_payment_status (movement_detail_id) -- Para filtrar pagados/pendientes
);
```

### 3. Historial de Estados (service_request_status_history)
```sql
CREATE TABLE service_request_status_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_request_id BIGINT NOT NULL,
    
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    
    changed_by BIGINT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    notes TEXT,
    
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    
    INDEX idx_service_request (service_request_id),
    INDEX idx_status_change (from_status, to_status),
    INDEX idx_changed_date (changed_at)
);
```

## Lógica de Negocio

### 1. Creación de Solicitud en Recepción

```php
class ReceptionService 
{
    public function createServiceRequest(array $data): ServiceRequest
    {
        DB::beginTransaction();
        
        try {
            // 1. Crear solicitud principal
            $request = ServiceRequest::create([
                'patient_id' => $data['patient_id'],
                'created_by' => Auth::id(),
                'request_number' => $this->generateRequestNumber(),
                'request_date' => $data['request_date'] ?? now()->toDateString(),
                'reception_type' => $data['reception_type'],
                'total_amount' => 0, // Se calculará con detalles
                'notes' => $data['notes'] ?? null,
            ]);
            
            $totalAmount = 0;
            
            // 2. Agregar cada servicio del "carrito"
            foreach ($data['services'] as $serviceData) {
                $detail = $this->addServiceToRequest($request, $serviceData);
                $totalAmount += $detail->total_amount;
            }
            
            // 3. Actualizar total de la solicitud
            $request->update(['total_amount' => $totalAmount]);
            
            // 4. Registrar en historial
            $this->recordStatusChange($request, null, 'pending_confirmation');
            
            DB::commit();
            return $request;
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    private function addServiceToRequest(ServiceRequest $request, array $serviceData): ServiceRequestDetail
    {
        // Obtener precio vigente para el seguro del paciente
        $patient = $request->patient;
        $price = app(PricingService::class)->getPriceForService(
            $serviceData['medical_service_id'],
            $patient->insurance_type_id,
            $request->request_date
        );
        
        $subtotal = $price->price * ($serviceData['quantity'] ?? 1);
        $discountAmount = $subtotal * (($serviceData['discount_percentage'] ?? 0) / 100);
        
        return ServiceRequestDetail::create([
            'service_request_id' => $request->id,
            'medical_service_id' => $serviceData['medical_service_id'],
            'professional_id' => $serviceData['professional_id'],
            'scheduled_date' => $serviceData['scheduled_date'],
            'scheduled_time' => $serviceData['scheduled_time'],
            'insurance_type_id' => $patient->insurance_type_id,
            'unit_price' => $price->price,
            'quantity' => $serviceData['quantity'] ?? 1,
            'subtotal' => $subtotal,
            'discount_percentage' => $serviceData['discount_percentage'] ?? 0,
            'discount_amount' => $discountAmount,
            'total_amount' => $subtotal - $discountAmount,
            'preparation_instructions' => $serviceData['preparation_instructions'] ?? null,
            'notes' => $serviceData['notes'] ?? null,
        ]);
    }
}
```

### 2. Frontend: Componente de Carrito

```typescript
// components/reception/ServiceCart.tsx
interface CartItem {
    medical_service_id: number;
    service: MedicalService;
    professional_id: number;
    professional: Professional;
    scheduled_date: string;
    scheduled_time: string;
    calculated_price: number;
    quantity: number;
    discount_percentage: number;
    total: number;
}

export const ServiceCart = ({ patientId }: { patientId: number }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedService, setSelectedService] = useState<MedicalService | null>(null);
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    
    const { data: patient } = useQuery({
        queryKey: ['patient', patientId],
        queryFn: () => api.get(`/patients/${patientId}`)
    });
    
    const { data: availableServices } = useQuery({
        queryKey: ['services-by-insurance', patient?.insurance_type_id],
        queryFn: () => api.get(`/services?insurance_type=${patient?.insurance_type_id}`),
        enabled: !!patient
    });
    
    const addServiceToCart = async (service: MedicalService, professional: Professional) => {
        // Calcular precio para el seguro del paciente
        const priceResponse = await api.get(
            `/pricing/calculate?service_id=${service.id}&insurance_type_id=${patient.insurance_type_id}`
        );
        
        const newItem: CartItem = {
            medical_service_id: service.id,
            service,
            professional_id: professional.id,
            professional,
            scheduled_date: '', // Usuario debe seleccionar
            scheduled_time: '',
            calculated_price: priceResponse.data.price,
            quantity: 1,
            discount_percentage: 0,
            total: priceResponse.data.price
        };
        
        setCartItems([...cartItems, newItem]);
    };
    
    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + item.total, 0);
    };
    
    const submitRequest = async () => {
        const requestData = {
            patient_id: patientId,
            reception_type: 'walk_in', // o el tipo correspondiente
            services: cartItems.map(item => ({
                medical_service_id: item.medical_service_id,
                professional_id: item.professional_id,
                scheduled_date: item.scheduled_date,
                scheduled_time: item.scheduled_time,
                quantity: item.quantity,
                discount_percentage: item.discount_percentage
            }))
        };
        
        await api.post('/reception/service-requests', requestData);
        // Redirect o mostrar success
    };
    
    return (
        <div className="space-y-6">
            {/* Búsqueda de Servicios */}
            <div>
                <Label>Buscar Servicios</Label>
                <ServiceSearchable
                    services={availableServices}
                    onServiceSelect={setSelectedService}
                />
            </div>
            
            {/* Búsqueda de Profesionales */}
            {selectedService && (
                <div>
                    <Label>Seleccionar Profesional</Label>
                    <ProfessionalSearchable
                        serviceId={selectedService.id}
                        onProfessionalSelect={(prof) => {
                            addServiceToCart(selectedService, prof);
                            setSelectedService(null);
                        }}
                    />
                </div>
            )}
            
            {/* Carrito de Servicios */}
            <Card>
                <CardHeader>
                    <CardTitle>Servicios Solicitados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {cartItems.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium">{item.service.name}</h4>
                                    <p className="text-sm text-gray-600">
                                        👨‍⚕️ {item.professional.first_name} {item.professional.last_name}
                                    </p>
                                </div>
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => removeFromCart(index)}
                                >
                                    ❌ Remover
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Fecha</Label>
                                    <Input
                                        type="date"
                                        value={item.scheduled_date}
                                        onChange={(e) => updateCartItem(index, 'scheduled_date', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Hora</Label>
                                    <Input
                                        type="time"
                                        value={item.scheduled_time}
                                        onChange={(e) => updateCartItem(index, 'scheduled_time', e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">
                                    {formatCurrency(item.total)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {patient?.insurance_type?.name}
                                </span>
                            </div>
                        </div>
                    ))}
                    
                    {cartItems.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                            No hay servicios agregados
                        </p>
                    )}
                </CardContent>
                
                {cartItems.length > 0 && (
                    <CardFooter className="flex justify-between">
                        <div className="text-xl font-bold">
                            Total: {formatCurrency(calculateTotal())}
                        </div>
                        <Button onClick={submitRequest} size="lg">
                            💾 Registrar Solicitud
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
};
```

## Integración Recepción → Caja

### 1. En Caja: Lista de Servicios Pendientes

```typescript
// components/cash-register/PendingServicesList.tsx
export const PendingServicesList = () => {
    const { data: pendingRequests } = useQuery({
        queryKey: ['pending-service-requests'],
        queryFn: () => api.get('/reception/pending-payments')
    });
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Servicios Pendientes de Cobro</h3>
            
            {pendingRequests?.map(request => (
                <Card key={request.id}>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium">
                                    {request.patient.first_name} {request.patient.last_name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                    CI: {request.patient.document_number}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Solicitud: {request.request_number}
                                </p>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-xl font-bold">
                                    {formatCurrency(request.total_amount)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {request.patient.insurance_type.name}
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                            {request.details.map(detail => (
                                <div key={detail.id} className="flex justify-between text-sm">
                                    <span>
                                        {detail.medical_service.name} - 
                                        Dr. {detail.professional.first_name}
                                    </span>
                                    <span>{formatCurrency(detail.total_amount)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4">
                            <Button 
                                onClick={() => processPayment(request)}
                                className="w-full"
                            >
                                💰 Procesar Cobro
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
```

## Resumen del Flujo Completo

```
1. RECEPCIÓN (Secretaria)
   ├── Busca/registra paciente ✅
   ├── Confirma seguro médico ✅
   ├── Busca servicios (filtrados por seguro) ✅
   ├── Selecciona profesional por servicio ✅
   ├── Agrega al "carrito" con horarios ✅
   ├── Calcula precios automáticamente ✅
   └── Genera ServiceRequest → status: 'pending_payment' ✅

2. CAJA (Cajero)
   ├── Ve lista de ServiceRequests pendientes ✅
   ├── Selecciona paciente/solicitud ✅
   ├── Procesa cobro (total o parcial) ✅
   ├── Genera Movement + MovementDetails ✅
   ├── Vincula con ServiceRequestDetails ✅
   └── Actualiza status → 'paid' ✅

3. COMISIONES (Automatico)
   ├── Servicios pagados quedan listos para liquidar ✅
   ├── Se pueden filtrar por profesional/período ✅
   └── Se calculan comisiones automáticamente ✅
```

Esta documentación completa el ecosistema **Recepción → Caja → Comisiones** con trazabilidad total y UI tipo carrito de compras. 

**¿Procedemos a implementar este módulo de recepción primero, o prefieres ir directo a servicios/caja asumiendo que recepción existe?** 🤔