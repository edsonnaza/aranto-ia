<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Crear tipos de seguro por defecto solo si no existen
        $insuranceTypes = [
            [
                'name' => 'Particular',
                'code' => 'PARTICULAR',
                'description' => 'Seguro particular - Pago directo del paciente',
                'status' => 'active',
            ],
            [
                'name' => 'ASSE',
                'code' => 'ASSE',
                'description' => 'Administración de los Servicios de Salud del Estado',
                'status' => 'active',
            ],
            [
                'name' => 'Mutualista',
                'code' => 'MUTUALISTA',
                'description' => 'Mutual de salud privada',
                'status' => 'active',
            ],
        ];

        foreach ($insuranceTypes as $insuranceType) {
            DB::table('insurance_types')->updateOrInsert(
                ['code' => $insuranceType['code']],
                array_merge($insuranceType, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('insurance_types')->whereIn('code', ['PARTICULAR', 'ASSE', 'MUTUALISTA'])->delete();
    }
};
