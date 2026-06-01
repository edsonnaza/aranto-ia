# Base de Datos del Módulo de Laboratorio - COMPLETADO

**Fecha:** 2025-05-31
**Estado:** ✅ COMPLETADO

## Resumen

Se ha completado exitosamente la implementación de la base de datos para el módulo de Laboratorio (LIS) de Aranto Medical ERP. Se crearon 7 nuevas migraciones, 4 nuevos modelos, se actualizaron 3 modelos existentes y se creó un seeder con 13 tipos de muestra estándar.

## Nuevas Migraciones Creadas (7)

### 1. create_lab_sample_types_table
- **Archivo:** `2026_05_31_000001_create_lab_sample_types_table.php`
- **Propósito:** Catálogo de tipos de muestra (Sangre, Suero, Orina, etc.)
- **Campos Principales:**
  - `name` - Nombre del tipo de muestra
  - `code` - Código único (ej: BLOOD, SERUM)
  - `container_type` - Tipo de contenedor requerido
  - `preservation_requirements` - Requisitos de conservación
  - `stability_hours` - Horas de estabilidad de la muestra
  - `status` - Estado (active/inactive)

### 2. create_lab_test_requests_table
- **Archivo:** `2026_05_31_000002_create_lab_test_requests_table.php`
- **Propósito:** Solicitudes individuales de pruebas de laboratorio
- **Campos Principales:**
  - `lab_sample_id` - FK a muestra
  - `lab_test_profile_id` - FK a perfil de prueba
  - `requested_by` - Usuario solicitante
  - `priority` - Prioridad (routine/urgent/stat)
  - `status` - Estado del flujo (pending/in_process/completed)
  - `assigned_to` - Técnico asignado
  - `started_at`, `completed_at` - Timestamps del proceso

### 3. create_lab_worksheets_table
- **Archivo:** `2026_05_31_000003_create_lab_worksheets_table.php`
- **Propósito:** Hojas de trabajo diarias para organizar pruebas por equipo
- **Campos Principales:**
  - `worksheet_number` - Número único de hoja de trabajo
  - `worksheet_date` - Fecha de la hoja de trabajo
  - `lab_equipment_id` - FK al equipo asignado
  - `technician_id` - FK al técnico responsable
  - `status` - Estado (draft/in_progress/completed/cancelled)

### 4. create_lab_worksheet_items_table
- **Archivo:** `2026_05_31_000004_create_lab_worksheet_items_table.php`
- **Propósito:** Tabla pivot entre worksheets y test requests
- **Campos Principales:**
  - `lab_worksheet_id` - FK a worksheet
  - `lab_test_request_id` - FK a solicitud de prueba
  - `position` - Orden en la worksheet
  - `status` - Estado (pending/processing/completed)

### 5. update_lab_samples_table
- **Archivo:** `2026_05_31_000005_update_lab_samples_table.php`
- **Propósito:** Actualizar tabla de muestras con nuevos campos
- **Cambios:**
  - ❌ Eliminado: `sample_type` (string)
  - ✅ Agregado: `lab_sample_type_id` (FK a lab_sample_types)
  - ✅ Agregado: `patient_id` (FK a patients)
  - ✅ Agregado: `barcode` (código de barras de la muestra)

### 6. add_lab_test_request_id_to_lab_validations
- **Archivo:** `2026_05_31_000006_add_lab_test_request_id_to_lab_validations.php`
- **Propósito:** Relacionar validaciones con solicitudes de prueba
- **Cambios:**
  - ✅ Agregado: `lab_test_request_id` (FK nullable a lab_test_requests)

### 7. add_lab_test_request_id_to_lab_results
- **Archivo:** `2026_05_31_000007_add_lab_test_request_id_to_lab_results.php`
- **Propósito:** Relacionar resultados con solicitudes de prueba
- **Cambios:**
  - ✅ Agregado: `lab_test_request_id` (FK nullable a lab_test_requests)

## Nuevos Modelos Creados (4)

### 1. LabSampleType
- **Ubicación:** `app/Models/Laboratory/LabSampleType.php`
- **Relaciones:**
  - `samples()` - hasMany → LabSample
- **Scopes:**
  - `active()` - Solo tipos activos

### 2. LabTestRequest
- **Ubicación:** `app/Models/Laboratory/LabTestRequest.php`
- **Relaciones:**
  - `sample()` - belongsTo → LabSample
  - `testProfile()` - belongsTo → LabTestProfile
  - `requestedBy()` - belongsTo → User
  - `assignedTo()` - belongsTo → User
  - `results()` - hasMany → LabResult
  - `validations()` - hasMany → LabValidation
  - `worksheetItems()` - hasMany → LabWorksheetItem
- **Scopes:**
  - `pending()` - Solo pendientes
  - `inProcess()` - Solo en proceso
  - `urgent()` - Solo urgentes/stat

### 3. LabWorksheet
- **Ubicación:** `app/Models/Laboratory/LabWorksheet.php`
- **Relaciones:**
  - `equipment()` - belongsTo → LabEquipment
  - `technician()` - belongsTo → User
  - `items()` - hasMany → LabWorksheetItem (ordenado por position)
- **Scopes:**
  - `active()` - Solo activas (draft/in_progress)
  - `today()` - Solo de hoy

### 4. LabWorksheetItem
- **Ubicación:** `app/Models/Laboratory/LabWorksheetItem.php`
- **Relaciones:**
  - `worksheet()` - belongsTo → LabWorksheet
  - `testRequest()` - belongsTo → LabTestRequest

## Modelos Actualizados (3)

### 1. LabSample
- **Cambios:**
  - ✅ Agregada relación `sampleType()` → LabSampleType
  - ✅ Agregada relación `patient()` → Patient
  - ✅ Agregada relación `receivedBy()` → User
  - ✅ Agregada relación `testRequests()` → LabTestRequest
  - ✅ Actualizado array `$fillable` con nuevos campos

### 2. LabResult
- **Cambios:**
  - ✅ Agregada relación `testRequest()` → LabTestRequest
  - ✅ Agregado campo `lab_test_request_id` en `$fillable`
  - ✅ Agregados `$casts` para calculated_percentage y is_out_of_range
  - ✅ Documentación PHPDoc para todas las relaciones

### 3. LabValidation
- **Cambios:**
  - ✅ Agregada relación `testRequest()` → LabTestRequest
  - ✅ Agregado campo `lab_test_request_id` en `$fillable`
  - ✅ Documentación PHPDoc para todas las relaciones

## Seeder Creado

### LabSampleTypeSeeder
- **Ubicación:** `database/seeders/LabSampleTypeSeeder.php`
- **Registros creados:** 13 tipos de muestra estándar

| Código | Nombre | Contenedor | Estabilidad |
|--------|--------|------------|-------------|
| BLOOD | Sangre Total | Tubo tapa lila (EDTA) | 24h |
| SERUM | Suero | Tubo tapa roja/amarilla | 48h |
| PLASMA | Plasma | Tubo tapa verde (Heparina) | 24h |
| URINE | Orina | Frasco estéril | 2h |
| URINE24H | Orina 24h | Recipiente con conservante | 4h |
| STOOL | Heces | Frasco hermético | 2h |
| SPUTUM | Esputo | Frasco estéril | 1h |
| THROAT_SWAB | Hisopado Faríngeo | Hisopo con medio | 24h |
| NASAL_SWAB | Hisopado Nasal | Hisopo con medio | 24h |
| CSF | LCR | Tubo estéril | 1h (INMEDIATO) |
| SYNOVIAL | Líquido Sinovial | Tubo estéril | 2h |
| EXUDATE | Exudado | Hisopo con medio | 24h |
| BIOPSY | Biopsia | Frasco con formol 10% | - |

## Ejecución de Migraciones

```bash
✅ 2026_05_31_000001_create_lab_sample_types_table ............... 98.70ms DONE
✅ 2026_05_31_000002_create_lab_test_requests_table ............. 205.70ms DONE
✅ 2026_05_31_000003_create_lab_worksheets_table ................. 96.08ms DONE
✅ 2026_05_31_000004_create_lab_worksheet_items_table ............ 79.54ms DONE
✅ 2026_05_31_000005_update_lab_samples_table ................... 153.25ms DONE
✅ 2026_05_31_000006_add_lab_test_request_id_to_lab_validations . 114.98ms DONE
✅ 2026_05_31_000007_add_lab_test_request_id_to_lab_results ...... 91.11ms DONE
```

## Ejecución de Seeders

```bash
✅ LabSampleTypeSeeder - 13 registros creados
```

## Diagrama de Entidades Principales

```
service_requests
    └── service_request_details (M:1 con lab_test_profiles)
            └── lab_samples
                    ├── lab_sample_type (M:1)
                    ├── patient (M:1)
                    └── lab_test_requests
                            ├── lab_test_profile (M:1)
                            ├── requested_by (M:1 User)
                            ├── assigned_to (M:1 User)
                            ├── lab_results (1:M)
                            ├── lab_validations (1:M)
                            └── lab_worksheet_items (1:M)
                                    └── lab_worksheets
                                            ├── lab_equipment (M:1)
                                            └── technician (M:1 User)
```

## Flujo de Trabajo del LIS

1. **Recepción de Muestra**
   - Se crea `LabSample` vinculada a `ServiceRequestDetail`
   - Se asigna `lab_sample_type_id`, `patient_id`, `barcode`
   - Estado inicial: `received`

2. **Solicitud de Pruebas**
   - Se crean `LabTestRequest` para cada prueba solicitada
   - Priority: routine/urgent/stat
   - Se asignan a técnicos

3. **Organización en Worksheets**
   - Se crean `LabWorksheet` agrupando test requests por equipo
   - Se agregan `LabWorksheetItem` con position para orden de ejecución

4. **Procesamiento**
   - Técnico ejecuta pruebas en orden de worksheet
   - Se registran `LabResult` vinculados a test_request

5. **Validación**
   - Se crea `LabValidation` vinculada a test_request
   - Cambio de estado a `validated`

6. **Reporte**
   - Se genera `LabReport` con resultados consolidados

## Próximos Pasos

### Fase 2: Controladores y Servicios
- [ ] Crear LabSampleTypeController con CRUD
- [ ] Crear LabTestRequestController con workflow management
- [ ] Crear LabWorksheetController con asignación de pruebas
- [ ] Crear servicios para lógica de negocio

### Fase 3: Frontend React
- [ ] Crear página de recepción de muestras
- [ ] Crear página de gestión de test requests
- [ ] Crear página de worksheets
- [ ] Crear hooks para cada entidad

### Fase 4: Validación y Reportes
- [ ] Implementar validación de resultados
- [ ] Implementar generación de PDF
- [ ] Implementar firma electrónica

## Notas Técnicas

- Todas las migraciones usan `foreignId()->constrained()` para FK
- Todos los modelos usan `SoftDeletes` trait
- Se mantiene compatibilidad con datos existentes usando `nullable()`
- Los enums están definidos directamente en migraciones
- Los timestamps se castean a Carbon datetime
- Las relaciones están completamente documentadas con PHPDoc

## Comandos de Verificación

```bash
# Ver estructura de tablas
php artisan db:show

# Ver tipos de muestra cargados
php artisan tinker --execute="App\Models\Laboratory\LabSampleType::all()"

# Verificar relaciones
php artisan tinker --execute="App\Models\Laboratory\LabSample::with('sampleType','patient')->first()"
```

---

**✅ IMPLEMENTACIÓN COMPLETADA CON ÉXITO**
