<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SpecialtiesFromLegacySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Mapeo de especialidades legacy a nuevas especialidades
        $specialtyMap = [
            'Oftalmologia' => [
                'name' => 'Oftalmología',
                'code' => 'OFT',
                'description' => 'Especialista en enfermedades de los ojos',
            ],
            'Cardiólogo' => [
                'name' => 'Cardiología',
                'code' => 'CARD',
                'description' => 'Especialista en enfermedades del corazón',
            ],
            'Anestesista' => [
                'name' => 'Anestesiología',
                'code' => 'ANES',
                'description' => 'Especialista en anestesia',
            ],
            'Cirujano' => [
                'name' => 'Cirugía General',
                'code' => 'CG',
                'description' => 'Especialista en cirugía general',
            ],
            'Cirujano Plástico' => [
                'name' => 'Cirugía Plástica',
                'code' => 'CP',
                'description' => 'Especialista en cirugía plástica',
            ],
            'Medicina Estética' => [
                'name' => 'Medicina Estética',
                'code' => 'ME',
                'description' => 'Especialista en medicina estética',
            ],
            'Bioquimico' => [
                'name' => 'Bioquímica',
                'code' => 'BQ',
                'description' => 'Especialista en bioquímica',
            ],
            'Otorrinonaringolo' => [
                'name' => 'Otorrinolaringología',
                'code' => 'ORL',
                'description' => 'Especialista en oído, nariz y garganta',
            ],
            'Pediatra' => [
                'name' => 'Pediatría',
                'code' => 'PED',
                'description' => 'Especialista en niños',
            ],
            'Dermatologo/a' => [
                'name' => 'Dermatología',
                'code' => 'DERM',
                'description' => 'Especialista en piel',
            ],
            'Traumatologia' => [
                'name' => 'Traumatología',
                'code' => 'TRAUM',
                'description' => 'Especialista en traumatología',
            ],
            'Urologo' => [
                'name' => 'Urología',
                'code' => 'URO',
                'description' => 'Especialista en urología',
            ],
            'Nutricionista' => [
                'name' => 'Nutrición',
                'code' => 'NUT',
                'description' => 'Especialista en nutrición',
            ],
            'Cirugia General' => [
                'name' => 'Cirugía General',
                'code' => 'CG',
                'description' => 'Especialista en cirugía general',
            ],
            'Clínico General' => [
                'name' => 'Medicina General',
                'code' => 'MG',
                'description' => 'Especialista en medicina general',
            ],
            'Ginecología y Obstetricia' => [
                'name' => 'Ginecología y Obstetricia',
                'code' => 'GIN',
                'description' => 'Especialista en ginecología y obstetricia',
            ],
            'Ecografista' => [
                'name' => 'Ecografía',
                'code' => 'ECO',
                'description' => 'Especialista en ecografía',
            ],
            'Odontologia' => [
                'name' => 'Odontología',
                'code' => 'ODO',
                'description' => 'Especialista en odontología',
            ],
            'Gastroenterologo' => [
                'name' => 'Gastroenterología',
                'code' => 'GASTRO',
                'description' => 'Especialista en gastroenterología',
            ],
            'Neurologo' => [
                'name' => 'Neurología',
                'code' => 'NEURO',
                'description' => 'Especialista en neurología',
            ],
            'Neumologia' => [
                'name' => 'Neumología',
                'code' => 'NEUM',
                'description' => 'Especialista en neumología',
            ],
            'Psicologo' => [
                'name' => 'Psicología',
                'code' => 'PSI',
                'description' => 'Especialista en psicología',
            ],
            'Medicina Familiar' => [
                'name' => 'Medicina Familiar',
                'code' => 'MF',
                'description' => 'Especialista en medicina familiar',
            ],
            'Puericultura y Crianza' => [
                'name' => 'Puericultura',
                'code' => 'PUER',
                'description' => 'Especialista en puericultura',
            ],
            'Fonoaudiologia' => [
                'name' => 'Fonoaudiología',
                'code' => 'FONO',
                'description' => 'Especialista en fonoaudiología',
            ],
            'Psicomotricista' => [
                'name' => 'Psicomotricidad',
                'code' => 'PSICO',
                'description' => 'Especialista en psicomotricidad',
            ],
            'Fisioterapia' => [
                'name' => 'Fisioterapia',
                'code' => 'FISIO',
                'description' => 'Especialista en fisioterapia',
            ],
            'Psiquiatria' => [
                'name' => 'Psiquiatría',
                'code' => 'PSIQ',
                'description' => 'Especialista en psiquiatría',
            ],
            'Radiografia' => [
                'name' => 'Radiología',
                'code' => 'RADIO',
                'description' => 'Especialista en radiología',
            ],
            'Reumatologia' => [
                'name' => 'Reumatología',
                'code' => 'REUM',
                'description' => 'Especialista en reumatología',
            ],
            'Mastologia' => [
                'name' => 'Mastología',
                'code' => 'MAST',
                'description' => 'Especialista en mastología',
            ],
            'Obstetricia' => [
                'name' => 'Obstetricia',
                'code' => 'OBS',
                'description' => 'Especialista en obstetricia',
            ],
            'Cirujano Maxilofacial' => [
                'name' => 'Cirugía Maxilofacial',
                'code' => 'CMF',
                'description' => 'Especialista en cirugía maxilofacial',
            ],
            'Endocrinologa Infantil' => [
                'name' => 'Endocrinología Infantil',
                'code' => 'ENDO',
                'description' => 'Especialista en endocrinología infantil',
            ],
        ];

        // Obtener especialidades de legacy
        $this->command->info('Obteniendo especialidades de la base de datos legacy...');
        $legacySpecialties = DB::connection('legacy')->table('especialidades')->get();

        if ($legacySpecialties->isEmpty()) {
            $this->command->warn('No se encontraron especialidades en la base de datos legacy');
            return;
        }

        $this->command->info("Se encontraron {$legacySpecialties->count()} especialidades");

        // Truncar la tabla de especialidades en aranto_medical
        $this->command->info('Truncando tabla de especialidades en aranto_medical...');
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=0');
        DB::connection('mysql')->table('specialties')->truncate();
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=1');

        // Insertar especialidades
        $specialtiesToInsert = [];
        $now = now();
        $usedCodes = [];

        foreach ($legacySpecialties as $specialty) {
            $legacyName = trim($specialty->Nombre);
            
            // Usar el mapeo si existe, si no, generar uno automático
            if (isset($specialtyMap[$legacyName])) {
                $mapped = $specialtyMap[$legacyName];
                $name = $mapped['name'];
                $code = $mapped['code'];
                $description = $mapped['description'];
            } else {
                // Generar automáticamente
                $name = $legacyName;
                $code = $this->generateCode($legacyName);
                $description = "Especialista en {$legacyName}";
            }

            // Evitar códigos duplicados
            if (isset($usedCodes[$code])) {
                $counter = 2;
                $originalCode = $code;
                while (isset($usedCodes[$code])) {
                    $code = $originalCode . $counter;
                    $counter++;
                }
            }
            $usedCodes[$code] = true;

            $specialtiesToInsert[] = [
                'name' => $name,
                'code' => $code,
                'description' => $description,
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ];

            $this->command->line("  ✓ {$legacyName} → {$name} ({$code})");
        }

        // Insertar en chunks para evitar problemas
        collect($specialtiesToInsert)->chunk(50)->each(function ($chunk) {
            DB::connection('mysql')->table('specialties')->insert($chunk->toArray());
        });

        $this->command->info("✓ Se insertaron " . count($specialtiesToInsert) . " especialidades exitosamente");
    }

    /**
     * Generar código a partir del nombre
     */
    private function generateCode(string $name): string
    {
        // Tomar las primeras letras de cada palabra (máximo 6 caracteres)
        $words = explode(' ', trim($name));
        $code = '';
        
        foreach ($words as $word) {
            if (strlen($code) >= 6) break;
            $code .= strtoupper(substr($word, 0, 1));
        }

        return $code ?: strtoupper(substr($name, 0, 6));
    }
}
