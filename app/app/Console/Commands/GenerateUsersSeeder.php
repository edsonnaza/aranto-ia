<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Genera database/seeders/UsersProductionSeeder.php con los usuarios actuales.
 *
 * El seeder generado es seguro para producción:
 * - Nunca borra registros.
 * - Inserta usuarios faltantes.
 * - En usuarios existentes, solo actualiza campos que cambiaron (por defecto: name).
 * - No pisa contraseñas existentes.
 * - Si incluye roles, solo agrega roles faltantes (no elimina roles actuales).
 *
 * Flujo:
 *   1. Local:      php artisan users:generate-seeder
 *   2. Local:      git add database/seeders/UsersProductionSeeder.php && git commit && git push
 *   3. Railway:    php artisan db:seed --class=UsersProductionSeeder
 */
class GenerateUsersSeeder extends Command
{
    protected $signature = 'users:generate-seeder
                            {--include-roles : Incluir también la asignación de roles de cada usuario}';

    protected $description = 'Genera UsersProductionSeeder.php de forma segura para producción (sin borrados y sin pisar contraseñas existentes)';

    public function handle(): int
    {
        $users = User::with('roles')->orderBy('id')->get();

        if ($users->isEmpty()) {
            $this->error('No hay usuarios en la base de datos local.');
            return self::FAILURE;
        }

        $includeRoles = $this->option('include-roles');
        $outputPath   = database_path('seeders/UsersProductionSeeder.php');

        $lines = [];
        foreach ($users as $user) {
            $name     = addslashes($user->name);
            $email    = addslashes($user->email);
            $password = addslashes($user->password); // bcrypt hash local, solo para usuarios nuevos

            if ($includeRoles && $user->roles->isNotEmpty()) {
                $roleNames = $user->roles->pluck('name')->map(fn($r) => "'{$r}'")->join(', ');
                $lines[] = <<<PHP
        \$u = User::firstOrNew(['email' => '{$email}']);
        \$isNew = !\$u->exists;

        \$changes = [];
        if (\$u->name !== '{$name}') {
            \$changes['name'] = '{$name}';
        }
        if (\$isNew) {
            \$changes['password'] = '{$password}';
        }

        if (!empty(\$changes)) {
            \$u->fill(\$changes);
            \$u->save();
        }

        \$this->assignRolesSafely(\$u, [{$roleNames}]);
PHP;
            } else {
                $lines[] = <<<PHP
        \$u = User::firstOrNew(['email' => '{$email}']);
        \$isNew = !\$u->exists;

        \$changes = [];
        if (\$u->name !== '{$name}') {
            \$changes['name'] = '{$name}';
        }
        if (\$isNew) {
            \$changes['password'] = '{$password}';
        }

        if (!empty(\$changes)) {
            \$u->fill(\$changes);
            \$u->save();
        }
PHP;
            }
        }

        $entries   = implode("\n\n", $lines);
        $count     = $users->count();
        $generated = now()->toDateTimeString();

        $useRoles = $includeRoles ? "use Spatie\\Permission\\Models\\Role;" : '';

        $content = <<<PHP
<?php

// AUTO-GENERADO por: php artisan users:generate-seeder
// Fecha: {$generated}
// Usuarios: {$count}
//
// Seguro para producción:
// - No borra usuarios.
// - Inserta faltantes.
// - Actualiza solo campos cambiados.
// - No pisa contraseñas existentes.
// - En roles, solo agrega roles faltantes.

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
{$useRoles}

class UsersProductionSeeder extends Seeder
{
    public function run(): void
    {
{$entries}
    }

    private function assignRolesSafely(User \$user, array \$roleNames): void
    {
        foreach (\$roleNames as \$roleName) {
            \$role = Role::findOrCreate(\$roleName, 'web');

            if (!\$user->roles->contains('name', \$role->name)) {
                \$user->assignRole(\$role);
            }
        }
    }
}
PHP;

        file_put_contents($outputPath, $content);

        $this->info("Seeder generado: database/seeders/UsersProductionSeeder.php");
        $this->line("  Usuarios incluidos: {$count}");
        $this->newLine();
        $this->line("Próximos pasos:");
        $this->line("  1. git add database/seeders/UsersProductionSeeder.php");
        $this->line("  2. git commit -m 'chore: update UsersProductionSeeder'");
        $this->line("  3. git push");
        $this->line("  4. En Railway: php artisan db:seed --class=UsersProductionSeeder");

        return self::SUCCESS;
    }
}
