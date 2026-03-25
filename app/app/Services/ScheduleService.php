<?php

namespace App\Services;

use App\Models\ProfessionalSchedule;
use App\Models\ProfessionalScheduleBlock;
use App\Models\ScheduleAppointment;
use App\Models\MedicalService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class ScheduleService
{
    public function getOccupancyReport(Carbon $dateFrom, Carbon $dateTo, ?int $professionalId = null): array
    {
        $slots = $this->buildSlotsForRange($dateFrom, $dateTo, $professionalId);

        $totalCapacity = array_sum(array_column($slots, 'capacity'));
        $totalBooked = array_sum(array_map(static fn (array $slot) => min($slot['occupied_count'], $slot['capacity']), $slots));

        $daily = collect($slots)
            ->groupBy('date')
            ->map(function (Collection $daySlots, string $date) {
                $capacity = $daySlots->sum('capacity');
                $booked = $daySlots->sum(function (array $slot) {
                    return min($slot['occupied_count'], $slot['capacity']);
                });

                return [
                    'date' => $date,
                    'capacity' => $capacity,
                    'booked' => $booked,
                    'occupancy_percentage' => $capacity > 0 ? round(($booked / $capacity) * 100, 2) : 0,
                ];
            })
            ->values()
            ->all();

        $professionals = collect($slots)
            ->groupBy('professional_id')
            ->map(function (Collection $professionalSlots) {
                $capacity = $professionalSlots->sum('capacity');
                $booked = $professionalSlots->sum(function (array $slot) {
                    return min($slot['occupied_count'], $slot['capacity']);
                });
                $first = $professionalSlots->first();

                return [
                    'professional_id' => $first['professional_id'],
                    'professional_name' => $first['professional_name'],
                    'capacity' => $capacity,
                    'booked' => $booked,
                    'occupancy_percentage' => $capacity > 0 ? round(($booked / $capacity) * 100, 2) : 0,
                ];
            })
            ->sortByDesc('occupancy_percentage')
            ->values()
            ->all();

        return [
            'total_capacity' => $totalCapacity,
            'total_booked' => $totalBooked,
            'occupancy_percentage' => $totalCapacity > 0 ? round(($totalBooked / $totalCapacity) * 100, 2) : 0,
            'daily' => $daily,
            'professionals' => $professionals,
        ];
    }

    public function getAvailabilityForDate(int $professionalId, Carbon $date): array
    {
        return array_values(array_filter(
            $this->buildSlotsForRange($date->copy()->startOfDay(), $date->copy()->endOfDay(), $professionalId),
            static fn (array $slot) => $slot['available_capacity'] > 0
        ));
    }

    public function getSlotBoardForDate(int $professionalId, Carbon $date): array
    {
        return $this->getSlotBoardForRange($professionalId, $date->copy()->startOfDay(), $date->copy()->startOfDay());
    }

    public function getSlotBoardForRange(int $professionalId, Carbon $dateFrom, Carbon $dateTo): array
    {
        $startDate = $dateFrom->copy()->startOfDay();
        $endDate = $dateTo->copy()->endOfDay();

        $schedules = ProfessionalSchedule::query()
            ->with(['professional', 'rules'])
            ->active()
            ->where('professional_id', $professionalId)
            ->whereDate('start_date', '<=', $dateTo->toDateString())
            ->where(function ($query) use ($dateFrom) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $dateFrom->toDateString());
            })
            ->get();

        $blocks = ProfessionalScheduleBlock::query()
            ->active()
            ->where('professional_id', $professionalId)
            ->where('start_datetime', '<=', $endDate)
            ->where('end_datetime', '>=', $startDate)
            ->get();

        $appointments = ScheduleAppointment::query()
            ->with(['patient', 'medicalService', 'serviceRequest'])
            ->where('professional_id', $professionalId)
            ->whereDate('appointment_date', '>=', $dateFrom->toDateString())
            ->whereDate('appointment_date', '<=', $dateTo->toDateString())
            ->whereNotIn('status', [ScheduleAppointment::STATUS_CANCELLED, ScheduleAppointment::STATUS_NO_SHOW])
            ->get();

        $serviceLookup = MedicalService::query()
            ->whereIn('id', $appointments->flatMap(function (ScheduleAppointment $appointment) {
                return collect($appointment->medical_service_ids ?? [])
                    ->when($appointment->medical_service_id, fn ($collection) => $collection->prepend((int) $appointment->medical_service_id))
                    ->filter()
                    ->map(fn ($serviceId) => (int) $serviceId)
                    ->all();
            })->unique()->values()->all())
            ->pluck('name', 'id');

        $slots = [];

        foreach ($schedules as $schedule) {
            $periodStart = $schedule->start_date?->copy()->startOfDay() ?? $startDate;
            $periodEnd = $schedule->end_date?->copy()->startOfDay() ?? $dateTo->copy()->startOfDay();

            if ($periodStart->greaterThan($dateTo->copy()->startOfDay()) || $periodEnd->lessThan($startDate)) {
                continue;
            }

            $loopStart = $periodStart->greaterThan($startDate) ? $periodStart : $startDate;
            $loopEnd = $periodEnd->lessThan($dateTo->copy()->startOfDay()) ? $periodEnd : $dateTo->copy()->startOfDay();

            foreach (CarbonPeriod::create($loopStart, $loopEnd) as $date) {
                $rules = $schedule->rules
                    ->where('weekday', (int) $date->dayOfWeek)
                    ->where('is_active', true);

                if ($rules->isEmpty()) {
                    continue;
                }

                $dateBlocks = $blocks->where('professional_id', $schedule->professional_id);
                $dateAppointments = $appointments
                    ->where('professional_id', $schedule->professional_id)
                    ->filter(function (ScheduleAppointment $appointment) use ($date) {
                        return Carbon::parse((string) $appointment->appointment_date)->toDateString() === $date->format('Y-m-d');
                    });

                foreach ($rules as $rule) {
                    $ruleStart = Carbon::parse($date->format('Y-m-d') . ' ' . $rule->start_time);
                    $ruleEnd = Carbon::parse($date->format('Y-m-d') . ' ' . $rule->end_time);
                    $slotDuration = max(5, (int) $schedule->slot_duration_minutes);
                    $cursor = $ruleStart->copy();

                    while ($cursor->lt($ruleEnd)) {
                        $slotEnd = $cursor->copy()->addMinutes($slotDuration);

                        if ($slotEnd->gt($ruleEnd)) {
                            break;
                        }

                        $overlappingBlock = $dateBlocks->first(function (ProfessionalScheduleBlock $block) use ($cursor, $slotEnd) {
                            return $this->intervalsOverlap($cursor, $slotEnd, $block->start_datetime, $block->end_datetime);
                        });

                        $slotAppointments = $dateAppointments
                            ->filter(function (ScheduleAppointment $appointment) use ($cursor, $slotEnd, $date) {
                                $appointmentDate = Carbon::parse((string) $appointment->appointment_date)->format('Y-m-d');
                                $appointmentStart = Carbon::parse($appointmentDate . ' ' . $appointment->start_time);
                                $appointmentEnd = Carbon::parse($appointmentDate . ' ' . $appointment->end_time);

                                return $this->intervalsOverlap($cursor, $slotEnd, $appointmentStart, $appointmentEnd);
                            })
                            ->values();

                        $occupiedCount = $slotAppointments->count();
                        $availableCapacity = $overlappingBlock ? 0 : max(0, (int) $rule->capacity - $occupiedCount);
                        $slotStatus = 'available';

                        if ($overlappingBlock) {
                            $slotStatus = 'blocked';
                        } elseif ($occupiedCount >= (int) $rule->capacity) {
                            $slotStatus = 'occupied';
                        } elseif ($occupiedCount > 0) {
                            $slotStatus = 'partial';
                        }

                        $slots[] = [
                            'professional_id' => $schedule->professional_id,
                            'professional_name' => $schedule->professional?->full_name ?? 'Profesional',
                            'date' => $date->format('Y-m-d'),
                            'start_time' => $cursor->format('H:i'),
                            'end_time' => $slotEnd->format('H:i'),
                            'duration_minutes' => $slotDuration,
                            'capacity' => (int) $rule->capacity,
                            'occupied_count' => $occupiedCount,
                            'available_capacity' => $availableCapacity,
                            'slot_status' => $slotStatus,
                            'block_title' => $overlappingBlock?->title,
                            'appointments' => $slotAppointments->map(fn (ScheduleAppointment $appointment) => $this->serializeSlotAppointment($appointment, $serviceLookup))->all(),
                        ];

                        $cursor = $slotEnd;
                    }
                }
            }
        }

        usort($slots, static function (array $left, array $right) {
            return [$left['date'], $left['start_time']] <=> [$right['date'], $right['start_time']];
        });

        return $slots;
    }

    private function serializeSlotAppointment(ScheduleAppointment $appointment, Collection $serviceLookup): array
    {
        $serviceIds = collect($appointment->medical_service_ids ?? [])
            ->when($appointment->medical_service_id, fn ($collection) => $collection->prepend((int) $appointment->medical_service_id))
            ->filter()
            ->map(fn ($serviceId) => (int) $serviceId)
            ->unique()
            ->values();

        $serviceNames = $serviceIds
            ->map(function (int $serviceId) use ($serviceLookup, $appointment) {
                return $serviceLookup->get($serviceId)
                    ?? ($appointment->medical_service_id === $serviceId ? $appointment->medicalService?->name : null);
            })
            ->filter()
            ->values();

        return [
            'id' => $appointment->id,
            'patient_id' => $appointment->patient_id,
            'patient_name' => $appointment->patient?->full_name,
            'medical_service_id' => $appointment->medical_service_id,
            'medical_service_ids' => $serviceIds->all(),
            'medical_service_name' => $serviceNames->implode(', '),
            'medical_service_names' => $serviceNames->all(),
            'service_request_id' => $appointment->service_request_id,
            'service_request_number' => $appointment->serviceRequest?->request_number,
            'service_request_status' => $appointment->serviceRequest?->status,
            'status' => $appointment->status,
            'notes' => $appointment->notes,
        ];
    }

    public function validateAppointmentSlot(
        int $professionalId,
        Carbon $appointmentDate,
        string $startTime,
        int $durationMinutes,
        ?int $ignoreAppointmentId = null
    ): array {
        $matchingRule = $this->getMatchingRule($professionalId, $appointmentDate, $startTime, $durationMinutes);

        if (!$matchingRule) {
            return [
                'valid' => false,
                'message' => 'La hora seleccionada no corresponde a una agenda activa para el profesional.',
            ];
        }

        $start = Carbon::parse($appointmentDate->format('Y-m-d') . ' ' . $startTime);
        $end = $start->copy()->addMinutes($durationMinutes);

        $hasBlock = ProfessionalScheduleBlock::query()
            ->active()
            ->where('professional_id', $professionalId)
            ->where(function ($query) use ($start, $end) {
                $query->where('start_datetime', '<', $end)
                    ->where('end_datetime', '>', $start);
            })
            ->exists();

        if ($hasBlock) {
            return [
                'valid' => false,
                'message' => 'La franja horaria está bloqueada para este profesional.',
            ];
        }

        $appointmentStart = Carbon::createFromFormat('H:i', $startTime);
        $appointmentEnd = $appointmentStart->copy()->addMinutes($durationMinutes);

        $appointmentsQuery = ScheduleAppointment::query()
            ->active()
            ->where('professional_id', $professionalId)
            ->whereDate('appointment_date', $appointmentDate->toDateString())
            ->where(function ($query) use ($appointmentStart, $appointmentEnd) {
                $query->where('start_time', '<', $appointmentEnd->format('H:i:s'))
                    ->where('end_time', '>', $appointmentStart->format('H:i:s'));
            });

        if ($ignoreAppointmentId) {
            $appointmentsQuery->where('id', '!=', $ignoreAppointmentId);
        }

        $overlappingAppointments = $appointmentsQuery->count();

        if ($overlappingAppointments >= $matchingRule['capacity']) {
            return [
                'valid' => false,
                'message' => 'La agenda ya no tiene cupo disponible para ese horario.',
            ];
        }

        return [
            'valid' => true,
            'message' => null,
        ];
    }

    private function buildSlotsForRange(Carbon $dateFrom, Carbon $dateTo, ?int $professionalId = null): array
    {
        $startDate = $dateFrom->copy()->startOfDay();
        $endDate = $dateTo->copy()->startOfDay();

        $schedules = ProfessionalSchedule::query()
            ->with(['professional', 'rules'])
            ->active()
            ->when($professionalId, function ($query) use ($professionalId) {
                $query->where('professional_id', $professionalId);
            })
            ->whereDate('start_date', '<=', $dateTo->toDateString())
            ->where(function ($query) use ($dateFrom) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $dateFrom->toDateString());
            })
            ->get();

        $blocks = ProfessionalScheduleBlock::query()
            ->active()
            ->when($professionalId, function ($query) use ($professionalId) {
                $query->where('professional_id', $professionalId);
            })
            ->where('start_datetime', '<=', $dateTo->copy()->endOfDay())
            ->where('end_datetime', '>=', $dateFrom->copy()->startOfDay())
            ->get();

        $appointments = ScheduleAppointment::query()
            ->active()
            ->with('professional')
            ->when($professionalId, function ($query) use ($professionalId) {
                $query->where('professional_id', $professionalId);
            })
            ->whereDate('appointment_date', '>=', $dateFrom->toDateString())
            ->whereDate('appointment_date', '<=', $dateTo->toDateString())
            ->get();

        $slots = [];

        foreach ($schedules as $schedule) {
            $periodStart = $schedule->start_date?->copy()->startOfDay() ?? $startDate;
            $periodEnd = $schedule->end_date?->copy()->startOfDay() ?? $endDate;

            if ($periodStart->greaterThan($endDate) || $periodEnd->lessThan($startDate)) {
                continue;
            }

            $loopStart = $periodStart->greaterThan($startDate) ? $periodStart : $startDate;
            $loopEnd = $periodEnd->lessThan($endDate) ? $periodEnd : $endDate;

            foreach (CarbonPeriod::create($loopStart, $loopEnd) as $date) {
                $weekday = (int) $date->dayOfWeek;
                $rules = $schedule->rules
                    ->where('weekday', $weekday)
                    ->where('is_active', true);

                if ($rules->isEmpty()) {
                    continue;
                }

                $dateBlocks = $blocks->where('professional_id', $schedule->professional_id);
                $dateAppointments = $appointments
                    ->where('professional_id', $schedule->professional_id)
                    ->filter(function (ScheduleAppointment $appointment) use ($date) {
                        return Carbon::parse((string) $appointment->appointment_date)->toDateString() === $date->format('Y-m-d');
                    });

                foreach ($rules as $rule) {
                    $ruleStart = Carbon::parse($date->format('Y-m-d') . ' ' . $rule->start_time);
                    $ruleEnd = Carbon::parse($date->format('Y-m-d') . ' ' . $rule->end_time);
                    $slotDuration = max(5, (int) $schedule->slot_duration_minutes);
                    $cursor = $ruleStart->copy();

                    while ($cursor->lt($ruleEnd)) {
                        $slotEnd = $cursor->copy()->addMinutes($slotDuration);

                        if ($slotEnd->gt($ruleEnd)) {
                            break;
                        }

                        $blocked = $dateBlocks->contains(function (ProfessionalScheduleBlock $block) use ($cursor, $slotEnd) {
                            return $this->intervalsOverlap($cursor, $slotEnd, $block->start_datetime, $block->end_datetime);
                        });

                        if (!$blocked) {
                            $occupiedCount = $dateAppointments->filter(function (ScheduleAppointment $appointment) use ($cursor, $slotEnd) {
                                $appointmentDate = Carbon::parse((string) $appointment->appointment_date)->format('Y-m-d');
                                $appointmentStart = Carbon::parse($appointmentDate . ' ' . $appointment->start_time);
                                $appointmentEnd = Carbon::parse($appointmentDate . ' ' . $appointment->end_time);

                                return $this->intervalsOverlap($cursor, $slotEnd, $appointmentStart, $appointmentEnd);
                            })->count();

                            $slots[] = [
                                'professional_id' => $schedule->professional_id,
                                'professional_name' => $schedule->professional?->full_name ?? 'Profesional',
                                'date' => $date->format('Y-m-d'),
                                'start_time' => $cursor->format('H:i'),
                                'end_time' => $slotEnd->format('H:i'),
                                'capacity' => (int) $rule->capacity,
                                'occupied_count' => $occupiedCount,
                                'available_capacity' => max(0, (int) $rule->capacity - $occupiedCount),
                            ];
                        }

                        $cursor = $slotEnd;
                    }
                }
            }
        }

        usort($slots, static function (array $left, array $right) {
            return [$left['date'], $left['start_time'], $left['professional_name']]
                <=> [$right['date'], $right['start_time'], $right['professional_name']];
        });

        return $slots;
    }

    private function getMatchingRule(
        int $professionalId,
        Carbon $appointmentDate,
        string $startTime,
        int $durationMinutes
    ): ?array {
        $schedules = ProfessionalSchedule::query()
            ->with('rules')
            ->active()
            ->where('professional_id', $professionalId)
            ->whereDate('start_date', '<=', $appointmentDate->toDateString())
            ->where(function ($query) use ($appointmentDate) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $appointmentDate->toDateString());
            })
            ->get();

        $start = Carbon::parse($appointmentDate->format('Y-m-d') . ' ' . $startTime);
        $end = $start->copy()->addMinutes($durationMinutes);
        $weekday = (int) $appointmentDate->dayOfWeek;

        foreach ($schedules as $schedule) {
            foreach ($schedule->rules as $rule) {
                if ((int) $rule->weekday !== $weekday || !$rule->is_active) {
                    continue;
                }

                $ruleStart = Carbon::parse($appointmentDate->format('Y-m-d') . ' ' . $rule->start_time);
                $ruleEnd = Carbon::parse($appointmentDate->format('Y-m-d') . ' ' . $rule->end_time);

                if ($start->greaterThanOrEqualTo($ruleStart) && $end->lessThanOrEqualTo($ruleEnd)) {
                    return [
                        'schedule_id' => $schedule->id,
                        'capacity' => (int) $rule->capacity,
                    ];
                }
            }
        }

        return null;
    }

    private function intervalsOverlap(Carbon $startA, Carbon $endA, Carbon $startB, Carbon $endB): bool
    {
        return $startA->lt($endB) && $endA->gt($startB);
    }
}