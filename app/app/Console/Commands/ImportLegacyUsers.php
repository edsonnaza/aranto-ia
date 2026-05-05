<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ImportLegacyUsers extends Command
{
    protected $signature = 'import:legacy-users
                            {--dry-run : Mostrar qué se importaría sin hacer cambios}
                            {--force : Actualizar contraseña de usuarios que ya existen}';

    protected $description = 'Importa usuarios desde db_legacy_infomed.users a la base de datos principal';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $force    = $this->option('force');

        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('    IMPORTADOR DE USUARIOS LEGACY');
        $this->info('═══════════════════════════════════════════════════════════');

        if ($isDryRun) {
            $this->warn('  MODO DRY-RUN: no se realizarán cambios en la base de datos');
        }
        $this->newLine();

        try {
            $legacyUsers = DB::connection('legacy')
                ->table('users')
                ->where('Active', '1')
                ->get();
        } catch (\Exception $e) {
            $this->error('No se pudo conectar a la base de datos legacy: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->info("Usuarios activos encontrados en legacy: {$legacyUsers->count()}");
        $this->newLine();

        $imported     = 0;
        $updated      = 0;
        $skipped      = 0;
        $seenEmails   = [];

        foreach ($legacyUsers as $legacy) {
            $name  = trim("{$legacy->Nombres} {$legacy->Apellido}") ?: $legacy->User;
            $email = !empty(trim($legacy->E_Mail))
                ? strtolower(trim($legacy->E_Mail))
                : strtolower("{$legacy->User}@legacy.local");

            // Skip duplicates within this import batch
            if (isset($seenEmails[$email])) {
                $this->line("  <fg=gray>DUPLICADO</>  {$legacy->User} ({$email}) — email ya procesado en este lote");
                $skipped++;
                continue;
            }
            $seenEmails[$email] = true;

            $existing = User::where('email', $email)->first();

            if ($existing) {
                if ($force) {
                    if (!$isDryRun) {
                        $existing->password = Hash::make($legacy->Pass);
                        $existing->save();
                    }
                    $this->line("  <fg=yellow>ACTUALIZADO</> {$legacy->User} ({$email})");
                    $updated++;
                } else {
                    $this->line("  <fg=gray>OMITIDO</>    {$legacy->User} ({$email}) — ya existe");
                    $skipped++;
                }
                continue;
            }

            if (!$isDryRun) {
                User::create([
                    'name'     => $name,
                    'email'    => $email,
                    'password' => Hash::make($legacy->Pass),
                ]);
            }

            $this->line("  <fg=green>IMPORTADO</>  {$legacy->User} → {$name} ({$email})");
            $imported++;
        }

        $this->newLine();
        $this->info("Resumen:");
        $this->line("  Importados: {$imported}");
        $this->line("  Actualizados: {$updated}");
        $this->line("  Omitidos (ya existían): {$skipped}");

        if ($isDryRun) {
            $this->newLine();
            $this->warn('Dry-run completo. Ejecuta sin --dry-run para aplicar los cambios.');
        }

        return self::SUCCESS;
    }
}
