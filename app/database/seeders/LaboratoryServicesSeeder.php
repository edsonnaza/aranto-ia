<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\ServiceCategory;
use App\Models\MedicalService;
use App\Models\ServicePrice;
use Carbon\Carbon;

class LaboratoryServicesSeeder extends Seeder
{
    public function run(): void
    {
        $particularId = DB::table('insurance_types')->where('code', 'PARTICULAR')->value('id');

        if (!$particularId) {
            $this->command->error('No se encontró el seguro PARTICULAR. Ejecuta primero InsuranceTypeSeeder.');
            return;
        }

        $today = Carbon::today()->toDateString();

        // ──────────────────────────────────────────────────────────────
        // Categoría raíz: Laboratorio Clínico
        // ──────────────────────────────────────────────────────────────
        $root = ServiceCategory::firstOrCreate(
            ['name' => 'Laboratorio Clínico'],
            ['parent_id' => null, 'description' => 'Servicios de análisis clínicos de laboratorio', 'status' => 'active']
        );

        // ──────────────────────────────────────────────────────────────
        // Sub-categorías con sus servicios
        // ──────────────────────────────────────────────────────────────
        $sections = [
            [
                'name' => 'Hematología',
                'description' => 'Análisis de células sanguíneas y coagulación',
                'services' => [
                    ['name' => 'Hemograma Completo',                  'code' => 'LAB-HEM-001', 'duration' => 30, 'price' => 45000],
                    ['name' => 'Hematocrito',                         'code' => 'LAB-HCT-001', 'duration' => 20, 'price' => 20000],
                    ['name' => 'Recuento de Plaquetas',               'code' => 'LAB-PLT-001', 'duration' => 20, 'price' => 25000],
                    ['name' => 'Grupo Sanguíneo y Factor Rh',         'code' => 'LAB-GRP-001', 'duration' => 20, 'price' => 30000],
                    ['name' => 'VSG (Eritrosedimentación)',            'code' => 'LAB-VSG-001', 'duration' => 60, 'price' => 20000],
                    ['name' => 'Reticulocitos',                       'code' => 'LAB-RET-001', 'duration' => 30, 'price' => 28000],
                ],
            ],
            [
                'name' => 'Coagulación',
                'description' => 'Tiempo de protrombina, TTPA y coagulograma',
                'services' => [
                    ['name' => 'Tiempo de Protrombina (TP / INR)',    'code' => 'LAB-COA-001', 'duration' => 30, 'price' => 35000],
                    ['name' => 'TTPA',                                'code' => 'LAB-COA-002', 'duration' => 30, 'price' => 35000],
                    ['name' => 'Coagulograma Completo',               'code' => 'LAB-COA-003', 'duration' => 30, 'price' => 65000],
                    ['name' => 'Fibrinógeno',                         'code' => 'LAB-COA-004', 'duration' => 30, 'price' => 40000],
                ],
            ],
            [
                'name' => 'Bioquímica General',
                'description' => 'Glucemia, función renal y perfil lipídico',
                'services' => [
                    ['name' => 'Glucemia',                            'code' => 'LAB-GLU-001', 'duration' => 20, 'price' => 20000],
                    ['name' => 'Glucemia en Ayunas',                  'code' => 'LAB-GLU-002', 'duration' => 20, 'price' => 22000],
                    ['name' => 'HbA1c (Hemoglobina Glicosilada)',     'code' => 'LAB-HBA-001', 'duration' => 30, 'price' => 60000],
                    ['name' => 'Urea',                                'code' => 'LAB-URE-001', 'duration' => 20, 'price' => 22000],
                    ['name' => 'Creatinina',                          'code' => 'LAB-CRE-001', 'duration' => 20, 'price' => 22000],
                    ['name' => 'Ácido Úrico',                         'code' => 'LAB-ACU-001', 'duration' => 20, 'price' => 22000],
                    ['name' => 'Colesterol Total',                    'code' => 'LAB-COL-001', 'duration' => 20, 'price' => 22000],
                    ['name' => 'Colesterol HDL',                      'code' => 'LAB-HDL-001', 'duration' => 20, 'price' => 25000],
                    ['name' => 'Colesterol LDL',                      'code' => 'LAB-LDL-001', 'duration' => 20, 'price' => 25000],
                    ['name' => 'Triglicéridos',                       'code' => 'LAB-TRI-001', 'duration' => 20, 'price' => 25000],
                    ['name' => 'Perfil Lipídico Completo',            'code' => 'LAB-LIP-001', 'duration' => 30, 'price' => 75000],
                    ['name' => 'Ionograma (Na / K / Cl)',             'code' => 'LAB-ION-001', 'duration' => 30, 'price' => 50000],
                    ['name' => 'Calcio',                              'code' => 'LAB-CAL-001', 'duration' => 20, 'price' => 25000],
                    ['name' => 'Fósforo',                             'code' => 'LAB-FOS-001', 'duration' => 20, 'price' => 25000],
                    ['name' => 'Magnesio',                            'code' => 'LAB-MAG-001', 'duration' => 20, 'price' => 28000],
                    ['name' => 'Proteínas Totales y Albúmina',        'code' => 'LAB-PRO-001', 'duration' => 20, 'price' => 30000],
                    ['name' => 'PCR (Proteína C Reactiva)',           'code' => 'LAB-PCR-001', 'duration' => 30, 'price' => 40000],
                ],
            ],
            [
                'name' => 'Hepatología',
                'description' => 'Función hepática y bilirrubinas',
                'services' => [
                    ['name' => 'Hepatograma Completo (TGO/TGP/FAL/GGT/BT/BD)', 'code' => 'LAB-HEP-001', 'duration' => 30, 'price' => 90000],
                    ['name' => 'TGO (AST)',                           'code' => 'LAB-TGO-001', 'duration' => 20, 'price' => 22000],
                    ['name' => 'TGP (ALT)',                           'code' => 'LAB-TGP-001', 'duration' => 20, 'price' => 22000],
                    ['name' => 'Fosfatasa Alcalina (FAL)',            'code' => 'LAB-FAL-001', 'duration' => 20, 'price' => 22000],
                    ['name' => 'GGT (Gamma-GT)',                      'code' => 'LAB-GGT-001', 'duration' => 20, 'price' => 25000],
                    ['name' => 'Bilirrubina Total y Directa',         'code' => 'LAB-BIL-001', 'duration' => 20, 'price' => 30000],
                ],
            ],
            [
                'name' => 'Metabolismo del Hierro',
                'description' => 'Ferritina, hierro sérico y transferrina',
                'services' => [
                    ['name' => 'Ferritina',                           'code' => 'LAB-FER-001', 'duration' => 30, 'price' => 55000],
                    ['name' => 'Hierro Sérico',                       'code' => 'LAB-HIE-001', 'duration' => 20, 'price' => 35000],
                    ['name' => 'Transferrina / TIBC',                 'code' => 'LAB-TRF-001', 'duration' => 30, 'price' => 45000],
                ],
            ],
            [
                'name' => 'Endocrinología / Hormonas',
                'description' => 'Tiroides, fertilidad y marcadores hormonales',
                'services' => [
                    ['name' => 'TSH',                                 'code' => 'LAB-TSH-001', 'duration' => 30, 'price' => 65000],
                    ['name' => 'T3 Libre (FT3)',                      'code' => 'LAB-T3L-001', 'duration' => 30, 'price' => 65000],
                    ['name' => 'T4 Libre (FT4)',                      'code' => 'LAB-T4L-001', 'duration' => 30, 'price' => 65000],
                    ['name' => 'Perfil Tiroideo (TSH + FT3 + FT4)',   'code' => 'LAB-TIR-001', 'duration' => 30, 'price' => 160000],
                    ['name' => 'Beta-HCG Cuantitativa',               'code' => 'LAB-HCG-001', 'duration' => 30, 'price' => 75000],
                    ['name' => 'Prolactina',                          'code' => 'LAB-PRL-001', 'duration' => 30, 'price' => 65000],
                    ['name' => 'Testosterona Total',                  'code' => 'LAB-TST-001', 'duration' => 30, 'price' => 70000],
                    ['name' => 'Cortisol Basal',                      'code' => 'LAB-COR-001', 'duration' => 30, 'price' => 70000],
                    ['name' => 'Insulina Basal',                      'code' => 'LAB-INS-001', 'duration' => 30, 'price' => 65000],
                    ['name' => 'PSA Total',                           'code' => 'LAB-PSA-001', 'duration' => 30, 'price' => 80000],
                    ['name' => 'PSA Libre',                           'code' => 'LAB-PSL-001', 'duration' => 30, 'price' => 80000],
                ],
            ],
            [
                'name' => 'Orina y Riñón',
                'description' => 'Análisis de orina y pruebas de función renal',
                'services' => [
                    ['name' => 'Orina Completa con Sedimento',        'code' => 'LAB-ORI-001', 'duration' => 20, 'price' => 40000],
                    ['name' => 'Proteinuria 24hs',                    'code' => 'LAB-PTU-001', 'duration' => 20, 'price' => 35000],
                    ['name' => 'Microalbuminuria',                    'code' => 'LAB-ALB-001', 'duration' => 20, 'price' => 45000],
                    ['name' => 'Clearance de Creatinina',             'code' => 'LAB-CLR-001', 'duration' => 20, 'price' => 40000],
                ],
            ],
            [
                'name' => 'Microbiología y Cultivos',
                'description' => 'Cultivos bacteriológicos y antibiogramas',
                'services' => [
                    ['name' => 'Urocultivo',                          'code' => 'LAB-URC-001', 'duration' => 60, 'price' => 80000],
                    ['name' => 'Hemocultivo',                         'code' => 'LAB-HMC-001', 'duration' => 60, 'price' => 100000],
                    ['name' => 'Coprocultivo',                        'code' => 'LAB-COC-001', 'duration' => 60, 'price' => 80000],
                    ['name' => 'Cultivo de Secreción',                'code' => 'LAB-CUS-001', 'duration' => 60, 'price' => 85000],
                    ['name' => 'Antibiograma',                        'code' => 'LAB-ABG-001', 'duration' => 60, 'price' => 50000],
                    ['name' => 'Coproparasitológico',                 'code' => 'LAB-COP-001', 'duration' => 30, 'price' => 35000],
                    ['name' => 'Gota Gruesa / Gota Fresca',           'code' => 'LAB-GGR-001', 'duration' => 30, 'price' => 30000],
                    ['name' => 'Antígeno Helicobacter pylori (heces)','code' => 'LAB-HPI-001', 'duration' => 30, 'price' => 90000],
                ],
            ],
            [
                'name' => 'Serología e Inmunología',
                'description' => 'HIV, VDRL, hepatitis y anticuerpos',
                'services' => [
                    ['name' => 'HIV (ELISA)',                         'code' => 'LAB-HIV-001', 'duration' => 30, 'price' => 60000],
                    ['name' => 'VDRL',                                'code' => 'LAB-VDR-001', 'duration' => 20, 'price' => 30000],
                    ['name' => 'Hepatitis B (HBsAg)',                 'code' => 'LAB-HBV-001', 'duration' => 30, 'price' => 65000],
                    ['name' => 'Anti-HBs (Anticuerpo Hep. B)',        'code' => 'LAB-HBS-001', 'duration' => 30, 'price' => 65000],
                    ['name' => 'Hepatitis C (Anti-HCV)',              'code' => 'LAB-HCV-001', 'duration' => 30, 'price' => 65000],
                    ['name' => 'Toxoplasma IgG / IgM',               'code' => 'LAB-TOX-001', 'duration' => 30, 'price' => 75000],
                    ['name' => 'Chagas (HAI / ELISA)',                'code' => 'LAB-CHA-001', 'duration' => 30, 'price' => 75000],
                    ['name' => 'Rosa de Bengala / Brucella',          'code' => 'LAB-BRU-001', 'duration' => 30, 'price' => 55000],
                    ['name' => 'ASO (Antiestreptolisinas)',           'code' => 'LAB-ASO-001', 'duration' => 30, 'price' => 40000],
                    ['name' => 'Factor Reumatoide',                   'code' => 'LAB-FRA-001', 'duration' => 30, 'price' => 40000],
                    ['name' => 'ANA (Anticuerpos Antinucleares)',      'code' => 'LAB-ANA-001', 'duration' => 30, 'price' => 90000],
                ],
            ],
        ];

        foreach ($sections as $section) {
            $subCategory = ServiceCategory::firstOrCreate(
                ['name' => $section['name'], 'parent_id' => $root->id],
                ['description' => $section['description'], 'status' => 'active']
            );

            foreach ($section['services'] as $svc) {
                $service = MedicalService::firstOrCreate(
                    ['code' => $svc['code']],
                    [
                        'name'                => $svc['name'],
                        'category_id'         => $subCategory->id,
                        'duration_minutes'    => $svc['duration'],
                        'requires_appointment'=> false,
                        'requires_preparation'=> false,
                        'status'              => 'active',
                    ]
                );

                ServicePrice::firstOrCreate(
                    [
                        'service_id'       => $service->id,
                        'insurance_type_id' => $particularId,
                        'effective_from'   => $today,
                    ],
                    [
                        'price'           => $svc['price'],
                        'effective_until' => null,
                        'notes'           => 'Precio inicial cargado por seeder',
                    ]
                );
            }

            $this->command->info("  ✔ {$subCategory->name} — " . count($section['services']) . ' servicios');
        }

        $this->command->info('LaboratoryServicesSeeder completado.');
    }
}
