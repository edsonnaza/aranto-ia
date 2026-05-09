<?php

namespace App\Console\Commands;

use App\Models\ProfessionalSchedule;
use App\Models\ScheduleAppointment;
use Carbon\Carbon;
use Illuminate\Console\Command;

class NormalizeScheduleAppointmentsToSlot extends Command
{
    protected $signature = 'schedule:normalize-appointments-to-slot
        {--from= : Fecha inicio Y-m-d}
        {--to= : Fecha fin Y-m-d}
        {--professional= : ID del profesional}
        {--dry-run : Solo mostrar cambios sin guardar}';

    protected $description = 'Normaliza citas existentes para que ocupen exactamente un slot de agenda';

    public function handle(): int
    {
        $from = $this->option('from');
        $to = $this->option('to');
        $professionalId = $this->option('professional');
        $dryRun = (bool) $this->option('dry-run');

        $appointmentsQuery = ScheduleAppointment::query()
            ->whereNotIn('status', [
                ScheduleAppointment::STATUS_CANCELLED,
                ScheduleAppointment::STATUS_NO_SHOW,
            ])
            ->when($professionalId, fn ($query) => $query->where('professional_id', (int) $professionalId))
            ->when($from, fn ($query) => $query->whereDate('appointment_date', '>=', (string) $from))
            ->when($to, fn ($query) => $query->whereDate('appointment_date', '<=', (string) $to))
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->orderBy('id');

        $appointments = $appointmentsQuery->get();

        if ($appointments->isEmpty()) {
            $this->info('No se encontraron citas en el rango indicado.');
            return self::SUCCESS;
        }

        $updated = 0;
        $reviewed = 0;

        foreach ($appointments as $appointment) {
            /** @var ScheduleAppointment $appointment */
            $reviewed++;

            $appointmentDate = Carbon::parse((string) $appointment->appointment_date)->toDateString();
            $startDateTime = Carbon::parse($appointmentDate . ' ' . substr((string) $appointment->start_time, 0, 5));
            $weekday = (int) $startDateTime->dayOfWeek;

            $schedules = ProfessionalSchedule::query()
                ->with('rules')
                ->active()
                ->where('professional_id', $appointment->professional_id)
                ->whereDate('start_date', '<=', $appointmentDate)
                ->where(function ($query) use ($appointmentDate) {
                    $query->whereNull('end_date')
                        ->orWhereDate('end_date', '>=', $appointmentDate);
                })
                ->orderByDesc('start_date')
                ->orderByDesc('id')
                ->get();

            $matchingSchedule = null;
            $matchingRule = null;

            foreach ($schedules as $schedule) {
                foreach ($schedule->rules as $rule) {
                    if ((int) $rule->weekday !== $weekday || !$rule->is_active) {
                        continue;
                    }

                    $ruleStart = Carbon::parse($appointmentDate . ' ' . substr((string) $rule->start_time, 0, 5));
                    $ruleEnd = Carbon::parse($appointmentDate . ' ' . substr((string) $rule->end_time, 0, 5));

                    if ($startDateTime->lt($ruleStart) || $startDateTime->gte($ruleEnd)) {
                        continue;
                    }

                    $minutesFromRuleStart = $ruleStart->diffInMinutes($startDateTime);
                    $slotDuration = max(1, (int) $schedule->slot_duration_minutes);

                    if ($minutesFromRuleStart % $slotDuration !== 0) {
                        continue;
                    }

                    $matchingSchedule = $schedule;
                    $matchingRule = $rule;
                    break 2;
                }
            }

            if (!$matchingSchedule || !$matchingRule) {
                continue;
            }

            $targetDuration = (int) $matchingSchedule->slot_duration_minutes;
            $targetEnd = $startDateTime->copy()->addMinutes($targetDuration)->format('H:i:s');
            $currentEnd = substr((string) $appointment->end_time, 0, 8);

            if ((int) $appointment->duration_minutes === $targetDuration && $currentEnd === $targetEnd) {
                continue;
            }

            $this->line(sprintf(
                'Cita #%d %s %s %s -> duracion %d=>%d, fin %s=>%s',
                $appointment->id,
                $appointment->professional_id,
                $appointmentDate,
                substr((string) $appointment->start_time, 0, 5),
                (int) $appointment->duration_minutes,
                $targetDuration,
                $currentEnd,
                $targetEnd
            ));

            if (!$dryRun) {
                $appointment->update([
                    'duration_minutes' => $targetDuration,
                    'end_time' => $targetEnd,
                ]);
            }

            $updated++;
        }

        if ($dryRun) {
            $this->info("Revision completada. Revisadas: {$reviewed}. Ajustables: {$updated}. (dry-run)");
        } else {
            $this->info("Normalizacion completada. Revisadas: {$reviewed}. Actualizadas: {$updated}.");
        }

        return self::SUCCESS;
    }
}
