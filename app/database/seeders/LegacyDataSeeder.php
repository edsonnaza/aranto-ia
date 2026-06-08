<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder MANUAL de migración legacy. NO se ejecuta en el deploy automático.
 *
 * Agrupa los seeders que NO son seguros para correr en cada despliegue, ya sea
 * porque dependen de la base legacy (`DB::connection('legacy')`) o porque son
 * destructivos. Existe para que estos seeders queden referenciados (no
 * huérfanos) y se puedan ejecutar a propósito, una sola vez, cuando se hace una
 * migración desde el sistema legacy:
 *
 *   php artisan db:seed --class=LegacyDataSeeder --force
 *
 * Requiere tener configurada la conexión `legacy` (db_legacy_infomed).
 *
 * ⚠️ LegacyCategorySeeder hace TRUNCATE de service_categories: úsalo solo en una
 * migración inicial controlada, nunca sobre datos de producción ya cargados.
 */
class LegacyDataSeeder extends Seeder
{
    public function run(): void
    {
        // ⚠️ Destructivo: reinicia service_categories con los IDs de legacy.
        $this->call(LegacyCategorySeeder::class);

        // Requieren conexión `legacy`.
        $this->call(MigrateProductosFromLegacySeeder::class);
        $this->call(PopulateLegacyServiceMappingsSeeder::class);
    }
}
