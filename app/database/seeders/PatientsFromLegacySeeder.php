<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Migra pacientes desde la base de datos legacy a aranto_medical
 * 
 * ESTRATEGIA DE MIGRACIÓN:
 * 
 * 1. FECHA DE NACIMIENTO (birth_date):
 *    - Campo: VARCHAR en legacy → DATE en aranto_medical
 *    - Validación: Rechaza fechas < 1900, vacías, o "0000-00-00"
 *    - Fallback: "1969-12-31" para fechas inválidas (detecta fácilmente datos corruptos)
 *    - Formato: YYYY-MM-DD (sin timestamp)
 *    - Nota: El helper parseDateWithoutUTC() en frontend evita offset de UTC
 * 
 * 2. GÉNERO (gender):
 *    - Campo: VARCHAR en legacy → ENUM('M','F','OTHER') en aranto_medical
 *    - Mapeo: M/MASCULINO/MALE → M
 *           F/FEMENINO/FEMALE → F
 *           O/OTRO/OTHER → OTHER
 *           Vacío/Inválido → OTHER
 *    - Garantía: Siempre retorna un valor válido
 * 
 * 3. TIMESTAMPS (created_at, updated_at):
 *    - Ambos se establece al momento de la migración
 *    - Permite auditoría de cuándo se migró cada paciente
 *    - Auditoría automática registra la acción de migración
 * 
 * 4. NÚMERO DE DOCUMENTO (document_number):
 *    - Validación de duplicados para evitar constraintviolations
 *    - Fallback: "PAC_{HC}" si está vacío o inválido
 *    - Garantiza unicidad: {document_type}-{document_number}
 * 
 * COMPATIBILIDAD CON HELPERS:
 * - formatBirthDate(): Usa birth_date en formato DATE (YYYY-MM-DD)
 * - calculateAge(): Calcula correctamente desde DATE
 * - parseDateWithoutUTC(): Evita offset de UTC al mostrar
 * - Gender mapping: M/F/OTHER matches form expectation en frontend
 */
class PatientsFromLegacySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener total de pacientes
        $totalPatients = DB::connection('legacy')->table('pacientes')->count();
        $this->command->info("Se encontraron {$totalPatients} pacientes en legacy");

        if ($totalPatients === 0) {
            $this->command->warn('No se encontraron pacientes en la base de datos legacy');
            return;
        }

        // Truncar la tabla de pacientes en aranto_medical
        $this->command->info('Truncando tabla de pacientes en aranto_medical...');
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=0');
        DB::connection('mysql')->table('patients')->truncate();
        DB::connection('mysql')->statement('ALTER TABLE patients AUTO_INCREMENT = 1');
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=1');

        // Obtener mapeo de insurance types
        $insuranceTypes = DB::connection('mysql')
            ->table('insurance_types')
            ->pluck('id', 'name')
            ->toArray();

        $this->command->info("Se encontraron " . count($insuranceTypes) . " tipos de seguros en aranto_medical");

        // Procesar en bloques para evitar saturar memoria
        $blockSize = 1000;
        $offset = 0;
        $inserted = 0;
        $skipped = 0;
        $usedDocuments = []; // Track usadas para evitar duplicados

        $this->command->info("Procesando pacientes en bloques de {$blockSize}...");

        while ($offset < $totalPatients) {
            // Leer bloque de pacientes
            $legacyPatients = DB::connection('legacy')
                ->table('pacientes')
                ->offset($offset)
                ->limit($blockSize)
                ->get();

            $patientsToInsert = [];

            foreach ($legacyPatients as $patient) {
                try {
                    // Validar campos requeridos - usar N/A como fallback
                    $firstName = $this->normalizeString($patient->Nombres ?? '');
                    $lastName = $this->normalizeString($patient->Apellido ?? '');
                    
                    // Asegurar que siempre hay valores
                    if (empty($firstName) || $firstName === 'N/A') {
                        $firstName = 'N/A';
                    }
                    if (empty($lastName) || $lastName === 'N/A') {
                        $lastName = 'N/A';
                    }

                    // Validar y procesar fecha de nacimiento
                    // validateDate ahora retorna string o null en formato Y-m-d
                    $birthDate = $this->validateDate($patient->Fecha_Nac);
                    if (!$birthDate) {
                        // Si la fecha es inválida, usar fecha por defecto (1969-12-31)
                        $birthDate = '1969-12-31';
                    }

                    // Transformar datos
                    // Si el número de documento es vacío, inválido (ej: "no tiene", "no sabe", "-"), usar PAC_{HC}
                    $docNumber = trim($patient->Nrodoc ?? '');
                    $documentType = $this->mapDocumentType($patient->Tipo_Doc_Codigo ?? null);
                    
                    if (empty($docNumber) || in_array(strtolower($docNumber), ['no tiene', 'no sabe', '-', 'no', '0', '°', '°', ''])) {
                        $documentNumber = "PAC_{$patient->HC}";
                    } else {
                        // Validar que no sea duplicado
                        $documentKey = "{$documentType}-{$docNumber}";
                        if (isset($usedDocuments[$documentKey])) {
                            // Si es duplicado, usar PAC_{HC} como fallback único
                            $documentNumber = "PAC_{$patient->HC}";
                        } else {
                            $documentNumber = $docNumber;
                        }
                    }
                    
                    // Trackear el documento_number final para evitar duplicados
                    $finalDocumentKey = "{$documentType}-{$documentNumber}";
                    $usedDocuments[$finalDocumentKey] = true;
                    
                    $gender = $this->mapGender($patient->Sexo ?? null);
                    
                    // Mapear tipo de seguro
                    $insuranceTypeId = $this->mapInsuranceType($patient, $insuranceTypes) ?? null;

                    // Teléfono y celular (prioridad: celular > teléfono)
                    $phone = $this->cleanPhoneNumber($patient->Celular ?? '') ?: 
                             $this->cleanPhoneNumber($patient->Telefono ?? '') ?: null;

                    // Email
                    $email = $this->cleanEmail($patient->Mail ?? '');

                    // Status y cobertura - valores por defecto
                    $status = 'active';
                    $insuranceCoveragePercentage = 100.00;

                    // Construir registro con SOLO 12 columnas
                    $patientRecord = [
                        'id' => (int)$patient->HC,
                        'document_type' => $documentType,
                        'document_number' => $documentNumber,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'birth_date' => $birthDate,
                        'gender' => $gender,
                        'insurance_coverage_percentage' => $insuranceCoveragePercentage,
                        'status' => $status,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // Agregar campos opcionales solo si tienen valor
                    if (!empty($phone)) {
                        $patientRecord['phone'] = $phone;
                    }
                    if (!empty($email)) {
                        $patientRecord['email'] = $email;
                    }
                    if ($insuranceTypeId !== null) {
                        $patientRecord['insurance_type_id'] = $insuranceTypeId;
                    }

                    $patientsToInsert[] = $patientRecord;

                    $inserted++;
                } catch (\Exception $e) {
                    $skipped++;
                    continue;
                }
            }

            // Insertar bloque procesado en chunks de 500
            if (!empty($patientsToInsert)) {
                // Normalizar todos los arrays a tener la misma estructura
                $normalizedPatients = array_map(function ($record) {
                    return [
                        'id' => $record['id'],
                        'document_type' => $record['document_type'],
                        'document_number' => $record['document_number'],
                        'first_name' => $record['first_name'],
                        'last_name' => $record['last_name'],
                        'birth_date' => $record['birth_date'],
                        'gender' => $record['gender'],
                        'insurance_coverage_percentage' => $record['insurance_coverage_percentage'],
                        'status' => $record['status'],
                        'phone' => $record['phone'] ?? null,
                        'email' => $record['email'] ?? null,
                        'insurance_type_id' => $record['insurance_type_id'] ?? null,
                        'created_at' => $record['created_at'] ?? now(),
                        'updated_at' => $record['updated_at'] ?? now(),
                    ];
                }, $patientsToInsert);

                collect($normalizedPatients)->chunk(500)->each(function ($chunk) {
                    DB::connection('mysql')->table('patients')->insert($chunk->toArray());
                });
            }

            $offset += $blockSize;
            $processedCount = min($offset, $totalPatients);
            $this->command->line("  ✓ Procesados {$processedCount}/{$totalPatients} pacientes...");

            // Liberar memoria
            unset($legacyPatients);
            unset($patientsToInsert);
            gc_collect_cycles();
        }

        $this->command->info("✓ Migración completada");
        $this->command->line("  - Pacientes insertados: {$inserted}");
        $this->command->line("  - Pacientes omitidos: {$skipped}");
    }

    /**
     * Mapear tipo de seguro de legacy a aranto_medical
     */
    private function mapInsuranceType($patient, $insuranceTypes)
    {
        // Si no hay seguroid válido, retornar null
        if (empty($patient->seguroid) || (int)$patient->seguroid <= 0) {
            return null;
        }

        // Intentar obtener el nombre del seguro desde la tabla legacy
        $legacySeguros = [
            1 => 'Particular',
            2 => 'Sermed',
            3 => 'SPS',
            4 => 'Migone',
            5 => 'Asismed',
            6 => 'Medilife',
            7 => 'Sanavid',
            8 => 'Medital',
            9 => 'SP',
            10 => 'Admisionales',
            11 => 'UNIMED',
        ];

        $legacyInsuranceId = (int)$patient->seguroid;
        $legacyInsuranceName = $legacySeguros[$legacyInsuranceId] ?? null;

        if (!$legacyInsuranceName) {
            return null;
        }

        // Buscar en aranto_medical por nombre exacto
        foreach ($insuranceTypes as $name => $id) {
            if (strtolower($name) === strtolower($legacyInsuranceName)) {
                return $id;
            }
        }

        // Búsqueda parcial como fallback
        foreach ($insuranceTypes as $name => $id) {
            if (stripos($name, $legacyInsuranceName) !== false || 
                stripos($legacyInsuranceName, $name) !== false) {
                return $id;
            }
        }

        return null;
    }

    /**
     * Validar que la fecha sea válida (no negativa, no NULL)
     * Retorna la fecha en formato YYYY-MM-DD o null si es inválida
     */
    private function validateDate($date): ?string
    {
        if (!$date || trim($date) === '' || $date === '0000-00-00' || $date === '0000-00-00 00:00:00') {
            return null;
        }

        try {
            $parsed = \Carbon\Carbon::parse($date);
            // Rechazar fechas anteriores a 1900
            if ($parsed->year < 1900) {
                return null;
            }
            // Retornar en formato DATE (YYYY-MM-DD) sin timestamp
            return $parsed->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Normalizar nombres (Primera letra de cada palabra mayúscula)
     * Detecta y corrige doble encoding UTF-8 (Ã¡ → á, Ã'n → ñ)
     * Maneja títulos sin espacios después del punto (ej: "Lic.natalia" → "Lic. Natalia")
     */
    private function normalizeString($string): string
    {
        if (!$string) return 'N/A';
        
        $trimmed = trim($string);
        
        // Paso 0: Corregir doble-encoding específico de ñ
        // Detectar patrones Ã seguido de comilla Unicode (e2 80 98/99) y reemplazar por ñ
        // Usar expresión regular con punto para cualquier carácter
        $trimmed = preg_replace('/[Ãã].{2}(?=[AS])/u', 'ñ', $trimmed);
        
        // Alternativa: reemplazar patrones específicos usando bytes
        $trimmed = preg_replace_callback('/Ã[^\w]/u', function($m) {
            // Si es Ã seguido de algo que no es palabra, probablemente sea ñ mal codificada
            return 'ñ';
        }, $trimmed);
        
        // Paso 1: Agregar espacios después de puntos si no los tienen
        $withSpaces = preg_replace('/(\.)([A-Za-z])/u', '. $2', $trimmed);
        
        // Paso 2: Normalizar múltiples espacios a un solo espacio
        $normalized = preg_replace('/\s+/u', ' ', $withSpaces);
        
        // Paso 3: Convertir a lowercase primero, luego capitalizar cada palabra
        return mb_convert_case($normalized, MB_CASE_TITLE, 'UTF-8');
    }

    /**
     * Mapear tipo de documento - NUNCA retorna null
     */
    private function mapDocumentType($documentType): string
    {
        if (!$documentType || trim($documentType) === '') {
            return 'CI';
        }

        $type = strtoupper(trim($documentType));

        $mapped = match ($type) {
            'PASSPORT', 'PAS', 'P' => 'PASSPORT',
            'CI', 'CEDULA', 'CARNET', 'C' => 'CI',
            default => 'OTHER',
        };
        
        return $mapped ?: 'CI';
    }

    /**
     * Mapear género - NUNCA retorna null
     */
    private function mapGender($gender): string
    {
        if (!$gender || trim($gender) === '') {
            return 'OTHER';
        }

        $g = strtoupper(trim($gender));

        $mapped = match ($g) {
            'M', 'MASCULINO', 'MALE' => 'M',
            'F', 'FEMENINO', 'FEMALE' => 'F',
            'O', 'OTRO', 'OTHER' => 'OTHER',
            default => 'OTHER',
        };
        
        return $mapped ?: 'OTHER';
    }

    /**
     * Limpiar número de teléfono
     */
    private function cleanPhoneNumber($phone): ?string
    {
        if (!$phone || $phone === '0' || trim($phone) === '') {
            return null;
        }

        // Remover caracteres especiales, dejar solo números y símbolos de teléfono
        $cleaned = preg_replace('/[^0-9+\-\s()]/', '', trim($phone));
        
        // Limitar a 20 caracteres máximo
        if (strlen($cleaned) > 20) {
            $cleaned = substr($cleaned, 0, 20);
        }
        
        return $cleaned ?: null;
    }

    /**
     * Limpiar email
     */
    private function cleanEmail($email): ?string
    {
        if (!$email || trim($email) === '' || trim($email) === '0') {
            return null;
        }

        $email = trim($email);

        // Validar que tenga formato de email
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $email;
        }

        return null;
    }
}
