<?php

use App\Models\Patient;
use App\Models\MedicalService;
use App\Models\Professional;
use App\Models\InsuranceType;
use Inertia\Inertia;
use Inertia\Response;

// Simular la lógica del método create()
try {
    echo "🔍 Iniciando prueba de ReceptionController::create()\n";
    
    // 1. Cargar pacientes
    echo "\n1. Cargando pacientes activos...\n";
    $patients = Patient::where('status', 'active')
        ->orderBy('first_name')
        ->orderBy('last_name')
        ->get(['id', 'first_name', 'last_name', 'document_type', 'document_number']);
    
    echo "   ✅ Pacientes: " . $patients->count() . "\n";
    
    // Mapear pacientes
    $patientsMapped = $patients->map(function ($patient) {
        return [
            'value' => $patient->id,
            'label' => $patient->full_name . ' - ' . $patient->formatted_document,
            'full_name' => $patient->full_name,
            'document' => $patient->formatted_document,
        ];
    });
    
    echo "   ✅ Pacientes mapeados: " . $patientsMapped->count() . "\n";
    
    // 2. Cargar servicios médicos
    echo "\n2. Cargando servicios médicos activos...\n";
    $medicalServices = MedicalService::with('category')
        ->where('status', 'active')
        ->orderBy('name')
        ->get();
    
    echo "   ✅ Servicios: " . $medicalServices->count() . "\n";
    
    // 3. Cargar profesionales
    echo "\n3. Cargando profesionales activos...\n";
    $professionals = Professional::where('status', 'active')
        ->orderBy('first_name')
        ->orderBy('last_name')
        ->get();
    
    echo "   ✅ Profesionales: " . $professionals->count() . "\n";
    
    // 4. Cargar seguros
    echo "\n4. Cargando seguros activos...\n";
    $insuranceTypes = InsuranceType::where('status', 'active')
        ->orderBy('name')
        ->get();
    
    echo "   ✅ Seguros: " . $insuranceTypes->count() . "\n";
    
    echo "\n✅ TODAS LAS CARGAS FUNCIONAN CORRECTAMENTE\n";
    echo "✅ El método create() debería funcionar sin errores\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
}
