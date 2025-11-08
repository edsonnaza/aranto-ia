# Sistema de Catastro: Pacientes y Profesionales

**Creado**: 7 de noviembre de 2025  
**Propósito**: Documentar la estructura de datos para pacientes y profesionales con sus relaciones hacia servicios médicos y facturación

## Arquitectura de Datos

### 1. Pacientes (patients)

```sql
CREATE TABLE patients (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_type ENUM('CI', 'PASSPORT', 'OTHER') NOT NULL,
    document_number VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender ENUM('M', 'F', 'OTHER') NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Seguro Médico
    insurance_type_id BIGINT NOT NULL,
    insurance_number VARCHAR(50),
    insurance_valid_until DATE,
    insurance_coverage_percentage DECIMAL(5,2) DEFAULT 100.00,
    
    -- Estado y Control
    status ENUM('active', 'inactive', 'deceased') DEFAULT 'active',
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_document (document_type, document_number),
    FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id),
    INDEX idx_full_name (first_name, last_name),
    INDEX idx_insurance (insurance_type_id),
    INDEX idx_status (status)
);
```

### 2. Profesionales (professionals)

```sql
CREATE TABLE professionals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT, -- Vinculación opcional con sistema de usuarios
    
    -- Datos Personales
    document_type ENUM('CI', 'PASSPORT', 'OTHER') NOT NULL,
    document_number VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    
    -- Datos Profesionales
    professional_license VARCHAR(50), -- Matrícula profesional
    license_expiry_date DATE,
    title VARCHAR(100), -- Dr., Lic., etc.
    
    -- Sistema de Comisiones
    commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Ej: 70.00 = 70%
    commission_calculation_method ENUM('percentage', 'fixed_amount', 'custom') DEFAULT 'percentage',
    
    -- Estado
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    hire_date DATE,
    termination_date DATE,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_document (document_type, document_number),
    UNIQUE KEY unique_license (professional_license),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_full_name (first_name, last_name),
    INDEX idx_status (status),
    INDEX idx_commission (commission_percentage)
);
```

### 3. Especialidades (specialties)

```sql
CREATE TABLE specialties (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_status (status)
);
```

### 4. Tabla Pivot: Profesional-Especialidad (professional_specialties)

```sql
CREATE TABLE professional_specialties (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    professional_id BIGINT NOT NULL,
    specialty_id BIGINT NOT NULL,
    certification_date DATE,
    certification_number VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE, -- Especialidad principal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(id),
    UNIQUE KEY unique_prof_specialty (professional_id, specialty_id),
    INDEX idx_professional (professional_id),
    INDEX idx_specialty (specialty_id)
);
```

### 5. Tipos de Seguro (insurance_types) - MEJORADO

```sql
CREATE TABLE insurance_types (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL, -- "Particular", "Unimed", "OSDE", etc.
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    
    -- Configuración de Facturación
    requires_authorization BOOLEAN DEFAULT FALSE,
    coverage_percentage DECIMAL(5,2) DEFAULT 100.00,
    has_copay BOOLEAN DEFAULT FALSE,
    copay_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Contacto y Administración
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    billing_address TEXT,
    
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_code (code),
    INDEX idx_status (status)
);
```

### 6. Servicios Médicos (medical_services) - MEJORADO

```sql
CREATE TABLE medical_services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL, -- "Consulta General", "Radiografía", etc.
    code VARCHAR(50) UNIQUE, -- Código interno o nomenclador
    description TEXT,
    
    -- Categorización
    category_id BIGINT,
    
    -- Configuración del Servicio
    duration_minutes INT DEFAULT 30,
    requires_appointment BOOLEAN DEFAULT TRUE,
    requires_preparation BOOLEAN DEFAULT FALSE,
    preparation_instructions TEXT,
    
    -- Comisiones por Defecto
    default_commission_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Estado
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES service_categories(id),
    INDEX idx_name (name),
    INDEX idx_code (code),
    INDEX idx_category (category_id),
    INDEX idx_status (status)
);
```

### 7. Precios de Servicios por Seguro (service_prices) - TABLA PIVOT

```sql
CREATE TABLE service_prices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_id BIGINT NOT NULL,
    insurance_type_id BIGINT NOT NULL,
    
    -- Precio y Vigencia
    price DECIMAL(10,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE NULL, -- NULL = vigente indefinidamente
    
    -- Metadatos
    created_by BIGINT, -- Usuario que creó el precio
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (service_id) REFERENCES medical_services(id) ON DELETE CASCADE,
    FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    -- Índices para performance
    INDEX idx_service (service_id),
    INDEX idx_insurance (insurance_type_id),
    INDEX idx_effective_period (effective_from, effective_until),
    INDEX idx_current_prices (service_id, insurance_type_id, effective_from, effective_until),
    
    -- Evitar solapamiento de períodos para la misma combinación servicio-seguro
    UNIQUE KEY unique_period (service_id, insurance_type_id, effective_from)
);
```

## Lógica de Negocio

### Cálculo de Precios

```php
// Función para obtener precio vigente
function getPriceForService($serviceId, $insuranceTypeId, $date = null) {
    $date = $date ?? now()->toDateString();
    
    return ServicePrice::where('service_id', $serviceId)
        ->where('insurance_type_id', $insuranceTypeId)
        ->where('effective_from', '<=', $date)
        ->where(function($query) use ($date) {
            $query->whereNull('effective_until')
                  ->orWhere('effective_until', '>=', $date);
        })
        ->orderBy('effective_from', 'desc')
        ->first();
}
```

### Cálculo de Comisiones

```php
// Función para calcular comisión de profesional
function calculateCommission($professionalId, $serviceId, $serviceAmount) {
    $professional = Professional::find($professionalId);
    $service = MedicalService::find($serviceId);
    
    // Prioridad: comisión específica del servicio, luego del profesional
    $commissionPercentage = $service->default_commission_percentage ?? $professional->commission_percentage;
    
    return ($serviceAmount * $commissionPercentage) / 100;
}
```

## Flujo de Datos

### 1. Registro de Paciente en Recepción
1. Paciente llega con su **tipo de seguro**
2. Se registra en `patients` con `insurance_type_id`
3. Se crea `service_request` con referencia al paciente

### 2. Cobro en Caja
1. Cajero busca servicios pendientes del paciente
2. Sistema obtiene precio usando `getPriceForService()`
3. Se genera `movement` y `movement_detail` con referencias
4. Se crea `receipt` con snapshot de datos

### 3. Liquidación de Comisiones
1. Se filtran `movement_details` por profesional y período
2. Se calcula comisión usando `calculateCommission()`
3. Se crea `commission_liquidation` con detalles
4. Se paga comisión generando nuevo `movement` tipo EXPENSE

## Validaciones Críticas

### Precios
- No pueden existir gaps en precios (siempre debe haber un precio vigente)
- No pueden solaparse períodos para la misma combinación servicio-seguro
- Al crear nuevo precio, el anterior debe tener `effective_until`

### Comisiones
- Porcentaje no puede superar 100%
- Profesional debe estar activo para liquidar comisiones
- Servicios ya liquidados no pueden volver a liquidarse

### Integridad Referencial
- Paciente debe tener seguro válido
- Servicio debe tener precio para el seguro del paciente
- Profesional debe tener especialidad relacionada al servicio

## Ejemplo Práctico

```php
// Caso: Paciente con Unimed necesita Consulta General

// 1. Datos del paciente
$patient = Patient::with('insuranceType')->find(123);
// $patient->insuranceType->name = "Unimed"

// 2. Servicio solicitado
$service = MedicalService::where('code', 'CONS_GRL')->first();
// $service->name = "Consulta General"

// 3. Precio vigente
$price = getPriceForService($service->id, $patient->insurance_type_id);
// $price->price = 180000 (para Unimed)

// 4. Profesional y comisión
$professional = Professional::find(456);
// $professional->commission_percentage = 70.00

$commission = calculateCommission($professional->id, $service->id, $price->price);
// $commission = 126000 (70% de 180000)
```

Esta arquitectura asegura:
✅ **Escalabilidad**: Fácil agregar nuevos seguros y precios
✅ **Flexibilidad**: Diferentes precios por seguro y período
✅ **Trazabilidad**: Complete audit trail de todos los cambios
✅ **Integridad**: Validaciones que previenen inconsistencias
✅ **Performance**: Índices optimizados para consultas frecuentes