<?php

namespace App\Console\Commands;

use App\Models\ProfessionalSchedule;
use App\Models\ScheduleAppointment;
use Carbon\Carbon;
use Illuminate\Console\Command;

class BackfillProfessionalScheduleIdOnAppointments extends Command
{
    protected $signature = 'schedule:backfill-professional-schedule-id';
    protected $description = 'Asigna el professional_schedule_id correcto a todas las citas existentes';

    public function handle(): int
    {
        $count = 0;
        ScheduleAppointment::whereNull('professional_schedule_id')->chunkById(100, function ($appointments) use (&$count) {
            foreach ($appointments as $appointment) {
                $schedule = ProfessionalSchedule::where('professional_id', $appointment->professional_id)
                    ->where('start_date', '<=', $appointment->appointment_date)
                    ->where(function($q) use ($appointment) {
                        $q->whereNull('end_date')->orWhere('end_date', '>=', $appointment->appointment_date);
                    })
                    ->where('status', ProfessionalSchedule::STATUS_ACTIVE)
                    ->first();
                if ($schedule) {
                    $appointment->professional_schedule_id = $schedule->id;
                    $appointment->save();
                    $count++;
                }
            }
        });
        $this->info("Citas actualizadas: $count");
        return 0;
    }
}
