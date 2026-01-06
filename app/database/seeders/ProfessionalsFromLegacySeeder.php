<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProfessionalsFromLegacySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener profesionales de legacy
        $this->command->info('Obteniendo profesionales de la base de datos legacy...');
        $legacyProfessionals = DB::connection('legacy')->table('profesionales')->get();

        if ($legacyProfessionals->isEmpty()) {
            $this->command->warn('No se encontraron profesionales en la base de datos legacy');
            return;
        }

        $this->command->info("Se encontraron {$legacyProfessionals->count()} profesionales");

        // Truncar la tabla de profesionales en aranto_medical
        $this->command->info('Truncando tabla de profesionales en aranto_medical...');
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=0');
        DB::connection('mysql')->table('professionals')->truncate();
        DB::connection('mysql')->statement('ALTER TABLE professionals AUTO_INCREMENT = 1');
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=1');

        // Obtener mapeo de especialidades
        $specialtyMap = DB::connection('mysql')
            ->table('specialties')
            ->pluck('id', 'name')
            ->toArray();

        $this->command->info("Se encontraron " . count($specialtyMap) . " especialidades en aranto_medical");

        // Transformar y insertar profesionales
        $professionalsToInsert = [];
        $now = now();
        $skipped = 0;
        $inserted = 0;

        foreach ($legacyProfessionals as $professional) {
            // Validar que no esté eliminado lógicamente (solo migrar si eliminado = 'NO')
            $isDeleted = strtoupper(trim($professional->eliminado)) !== 'NO';
            if ($isDeleted) {
                $this->command->line("  ⊘ Omitido (eliminado): {$professional->Apellido}, {$professional->Nombres}");
                $skipped++;
                continue;
            }

            // Transformar datos
            $firstName = $this->normalizeString($professional->Nombres);
            $lastName = $this->normalizeString($professional->Apellido);
            // Si no tiene número de documento, usar el ID como identificador único
            $documentNumber = trim($professional->Nro_Doc) ?: "PROF_{$professional->Id}";
            $documentType = $this->mapDocumentType($professional->Tipo_Doc);
            $gender = $this->mapGender($professional->genero);
            
            // Tratar Activo como booleano: convertir a int (0 o 1)
            $isActiveValue = (int)trim($professional->Activo);
            $isActive = $isActiveValue === 1 ? true : false;

            // Obtener specialty_id
            $specialtyId = $this->mapSpecialty($professional, $specialtyMap);

            // Comisión: usar cinterno si existe, si no usar comision
            $commission = $professional->cinterno ?? $professional->comision ?? 0;
            $commission = (float)$commission; // El valor ya está en formato correcto (ej: 70, no 0.7)

            // Status: active si Activo=1, inactive si Activo=0
            $status = $isActive ? 'active' : 'inactive';

            // Fecha alta
            $hireDate = $this->validateDate($professional->fechaalta) ? 
                \Carbon\Carbon::parse($professional->fechaalta)->toDateString() : 
                \Carbon\Carbon::now()->toDateString();

            $professionalsToInsert[] = [
                'id' => $professional->Id, // Mantener el mismo ID del legacy
                'identification' => $professional->Profesional_Codigo ?: null,
                'document_type' => $documentType,
                'document_number' => $documentNumber,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'phone' => $this->cleanPhoneNumber($professional->Telefono),
                'email' => $this->cleanEmail($professional->Mail),
                'address' => trim($professional->Domicilio) ?: null,
                'professional_license' => trim($professional->Matricula_Provincial) ?: trim($professional->Matricula_Nacional) ?: null,
                'license_number' => trim($professional->Matricula_Nacional) ?: null,
                'title' => null,
                'commission_percentage' => $commission,
                'commission_calculation_method' => 'percentage',
                'status' => $status,
                'is_active' => (int)$isActive, // Cast a int para el campo tinyint(1)
                'hire_date' => $hireDate,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Insertar inmediatamente y luego asociar especialidades
            $inserted++;
            $this->command->line("  ✓ {$lastName}, {$firstName} ({$documentNumber}) - Comisión: {$commission}%");
        }

        // Insertar en chunks
        collect($professionalsToInsert)->chunk(50)->each(function ($chunk) {
            DB::connection('mysql')->table('professionals')->insert($chunk->toArray());
        });

        // Ahora asociar especialidades (tabla pivot professional_specialties)
        $this->command->info('Asociando especialidades a profesionales...');
        
        // Truncar tabla pivot primero
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=0');
        DB::connection('mysql')->table('professional_specialties')->truncate();
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=1');
        
        $this->associateSpecialties($legacyProfessionals, $specialtyMap, $now);

        $this->command->info("✓ Migración completada");
        $this->command->line("  - Profesionales insertados: {$inserted}");
        $this->command->line("  - Profesionales omitidos (eliminados): {$skipped}");
    }

    /**
     * Asociar especialidades a los profesionales migrados
     */
    private function associateSpecialties($legacyProfessionals, $specialtyMap, $now): void
    {
        $associations = [];

        foreach ($legacyProfessionals as $legacyProf) {
            // Omitir eliminados (solo procesar si eliminado = 'NO')
            if (strtoupper(trim($legacyProf->eliminado)) !== 'NO') {
                continue;
            }

            // Usar el mismo ID del legacy ya que fue insertado con el mismo ID
            $professionalId = $legacyProf->Id;

            // PRIORIDAD 1: Usar Especialidad_Id directo si existe y es válido (> 0)
            $specialtyId = null;
            if (!empty($legacyProf->Especialidad_Id) && (int)$legacyProf->Especialidad_Id > 0) {
                $specialtyId = (int)$legacyProf->Especialidad_Id;
                
                // Verificar que la especialidad existe en aranto_medical
                $exists = DB::connection('mysql')
                    ->table('specialties')
                    ->where('id', $specialtyId)
                    ->exists();
                
                if (!$exists) {
                    $specialtyId = null;
                }
            }
            
            // PRIORIDAD 2: Si no hay ID directo, mapear por nombre
            if (!$specialtyId) {
                $specialtyId = $this->mapSpecialtyId($legacyProf, $specialtyMap);
            }
            
            // Si aún no hay especialidad, omitir este profesional
            if (!$specialtyId) {
                continue;
            }

            $associations[] = [
                'professional_id' => $professionalId,
                'specialty_id' => $specialtyId,
                'is_primary' => 1, // Primera especialidad como principal
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Insertar asociaciones
        if (!empty($associations)) {
            collect($associations)->chunk(50)->each(function ($chunk) {
                DB::connection('mysql')->table('professional_specialties')->insert($chunk->toArray());
            });
        }
    }

    /**
     * Mapear especialidad de legacy a aranto_medical
     */
    private function mapSpecialty($professional, $specialtyMap)
    {
        // Intentar mapear por nombre de especialidad
        $specialtyName = trim($professional->Especialidad);

        foreach ($specialtyMap as $name => $id) {
            if (strtolower($name) === strtolower($specialtyName)) {
                return $id;
            }

            // Búsqueda parcial para casos de variaciones
            if (stripos($name, $specialtyName) !== false || stripos($specialtyName, $name) !== false) {
                return $id;
            }
        }

        // Si no encontramos coincidencia exacta, retornar null
        return null;
    }

    /**
     * Obtener specialty_id por nombre
     */
    private function mapSpecialtyId($professional, $specialtyMap)
    {
        return $this->mapSpecialty($professional, $specialtyMap);
    }

    /**
     * Validar que la fecha sea válida (no negativa, no NULL)
     */
    private function validateDate($date): bool
    {
        if (!$date || trim($date) === '' || $date === '0000-00-00') {
            return false;
        }

        try {
            $parsed = \Carbon\Carbon::parse($date);
            // Rechazar fechas anteriores a 1900
            if ($parsed->year < 1900) {
                return false;
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Normalizar nombres (Primera letra de cada palabra mayúscula)
     * Maneja títulos sin espacios después del punto (ej: "Lic.natalia" → "Lic. Natalia")
     */
    private function normalizeString($string): string
    {
        if (!$string) return 'N/A';
        
        $trimmed = trim($string);
        
        // Paso 1: Agregar espacios después de puntos si no los tienen
        // Patrón: punto seguido de letra (sin espacio) → punto + espacio + letra
        $withSpaces = preg_replace('/(\.)([A-Za-z])/', '. $2', $trimmed);
        
        // Paso 2: Normalizar múltiples espacios a un solo espacio
        $normalized = preg_replace('/\s+/', ' ', $withSpaces);
        
        // Paso 3: Convertir a lowercase primero, luego capitalizar cada palabra
        return mb_convert_case($normalized, MB_CASE_TITLE, 'UTF-8');
    }

    /**
     * Mapear tipo de documento
     */
    private function mapDocumentType($documentType): string
    {
        if (!$documentType) {
            return 'CI';
        }

        $type = strtoupper(trim($documentType));

        return match ($type) {
            'PASSPORT', 'PAS', 'P' => 'PASSPORT',
            'CI', 'CEDULA', 'CARNET' => 'CI',
            default => 'OTHER',
        };
    }

    /**
     * Mapear género
     */
    private function mapGender($gender): ?string
    {
        if (!$gender) {
            return null;
        }

        $g = strtoupper(trim($gender));

        return match ($g) {
            'M', 'MASCULINO', 'MALE' => 'male',
            'F', 'FEMENINO', 'FEMALE' => 'female',
            'O', 'OTRO', 'OTHER' => 'other',
            default => null,
        };
    }

    /**
     * Limpiar número de teléfono
     */
    private function cleanPhoneNumber($phone): ?string
    {
        if (!$phone || $phone === '0' || trim($phone) === '') {
            return null;
        }

        // Remover caracteres especiales, dejar solo números
        $cleaned = preg_replace('/[^0-9+\-\s()]/', '', trim($phone));
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
