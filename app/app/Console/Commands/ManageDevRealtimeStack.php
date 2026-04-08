<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ManageDevRealtimeStack extends Command
{
    protected $signature = 'dev:realtime
        {action : Accion a ejecutar: up, down, logs o ps}
        {--build : Reconstruir imagenes al levantar el stack}';

    protected $description = 'Gestiona el stack local de Docker para app, reverb, mysql y redis';

    public function handle(): int
    {
        $action = strtolower((string) $this->argument('action'));

        if (!in_array($action, ['up', 'down', 'logs', 'ps'], true)) {
            $this->error('Accion invalida. Usa: up, down, logs o ps.');

            return self::FAILURE;
        }

        if (!$this->dockerComposeAvailable()) {
            $this->error('docker compose no esta disponible en este entorno.');

            return self::FAILURE;
        }

        $command = match ($action) {
            'up' => $this->buildUpCommand(),
            'down' => 'docker compose stop app reverb mysql redis',
            'logs' => 'docker compose logs -f app reverb',
            'ps' => 'docker compose ps',
        };

        $this->info(match ($action) {
            'up' => 'Levantando stack local con Reverb...',
            'down' => 'Deteniendo stack local con Reverb...',
            'logs' => 'Mostrando logs en vivo de app y reverb...',
            'ps' => 'Mostrando estado del stack...',
        });

        return $this->runShellCommand($command);
    }

    private function buildUpCommand(): string
    {
        $buildFlag = $this->option('build') ? ' --build' : '';

        return sprintf('docker compose up -d%s app reverb mysql redis', $buildFlag);
    }

    private function dockerComposeAvailable(): bool
    {
        $process = Process::fromShellCommandline('docker compose version');
        $process->setWorkingDirectory($this->projectRoot());
        $process->run();

        return $process->isSuccessful();
    }

    private function runShellCommand(string $command): int
    {
        $process = Process::fromShellCommandline($command);
        $process->setWorkingDirectory($this->projectRoot());
        $process->setTimeout(null);

        $process->run(function (string $type, string $output): void {
            if ($type === Process::ERR) {
                $this->output->write($output);

                return;
            }

            $this->output->write($output);
        });

        return $process->isSuccessful() ? self::SUCCESS : self::FAILURE;
    }

    private function projectRoot(): string
    {
        return dirname(base_path());
    }
}