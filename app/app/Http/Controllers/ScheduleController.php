<?php

namespace App\Http\Controllers;

use App\Models\MedicalService;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use App\Models\ProfessionalScheduleBlock;
use App\Models\ScheduleAppointment;
use App\Services\ScheduleService;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function __construct(private readonly ScheduleService $scheduleService)
    {
    }

    public function index(Request $request): Response
    {
        $perPage = max(5, min(100, (int) $request->integer('per_page', 10)));
        $dateFrom = $request->filled('date_from')
            ? Carbon::parse((string) $request->get('date_from'))->startOfDay()
            : Carbon::today()->startOfDay();

        $dateTo = $request->filled('date_to')
            ? Carbon::parse((string) $request->get('date_to'))->startOfDay()
            : $dateFrom->copy()->addDays(13)->startOfDay();

        if ($dateTo->lt($dateFrom)) {
            $dateTo = $dateFrom->copy();
        }

        $selectedDate = $request->filled('selected_date')
            ? Carbon::parse((string) $request->get('selected_date'))->startOfDay()
            : $dateFrom->copy();

        $professionalId = $request->filled('professional_id') ? (int) $request->get('professional_id') : null;
        $scheduleSearch = trim((string) $request->get('search', ''));
        $scheduleStatus = $request->filled('status') ? (string) $request->get('status') : null;

        $professionals = $this->getProfessionalsList();
        $medicalServices = $this->getMedicalServicesList();
        $medicalServicesLookup = collect($medicalServices)->keyBy('id');

        $schedules = $this->getSchedulesPaginated($professionalId, $scheduleSearch, $scheduleStatus, $perPage);
        $blocks = $this->getBlocksList($professionalId, $dateFrom, $dateTo);
        $appointments = $this->getAppointmentsList($professionalId, $dateFrom, $dateTo, $medicalServicesLookup);

        $occupancy = $this->scheduleService->getOccupancyReport($dateFrom, $dateTo, $professionalId);
        $slotBoard = $professionalId
            ? $this->scheduleService->getSlotBoardForDate($professionalId, $selectedDate)
            : [];

        return Inertia::render('medical/schedule/Index', [
            'professionals' => $professionals,
            'medicalServices' => $medicalServices,
            'schedules' => $schedules,
            'blocks' => $blocks,
            'appointments' => $appointments,
            'occupancy' => $occupancy,
            'slotBoard' => $slotBoard,
            'filters' => [
                'professional_id' => $professionalId,
                'date_from' => $dateFrom->format('Y-m-d'),
                'date_to' => $dateTo->format('Y-m-d'),
                'selected_date' => $selectedDate->format('Y-m-d'),
                'search' => $scheduleSearch,
                'status' => $scheduleStatus,
                'per_page' => $perPage,
            ],
        ]);
    }

    private function getProfessionalsList(): array
    {
        return Professional::query()
            ->active()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(fn (Professional $p) => [
                'id' => $p->id,
                'full_name' => $p->full_name,
                'specialties' => $p->specialties->pluck('name')->values()->all(),
            ])
            ->values()
            ->all();
    }

    private function getMedicalServicesList(): array
    {
        return MedicalService::query()
            ->active()
            ->requiresAppointment()
            ->orderBy('name')
            ->get()
            ->map(fn (MedicalService $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'duration_minutes' => $s->duration_minutes,
            ])
            ->values()
            ->all();
    }

    private function getSchedulesPaginated(?int $professionalId, string $search, ?string $status, int $perPage): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return ProfessionalSchedule::query()
            ->with(['professional', 'rules'])
            ->when($professionalId, fn ($q) => $q->where('professional_id', $professionalId))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', '%' . $search . '%')
                        ->orWhereHas('professional', function ($pq) use ($search) {
                            $pq->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ['%' . $search . '%'])
                                ->orWhereRaw("CONCAT(last_name, ' ', first_name) LIKE ?", ['%' . $search . '%']);
                        });
                });
            })
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (ProfessionalSchedule $schedule) => [
                'id' => $schedule->id,
                'professional_id' => $schedule->professional_id,
                'professional_name' => $schedule->professional?->full_name,
                'name' => $schedule->name,
                'start_date' => $schedule->start_date ? Carbon::parse((string) $schedule->start_date)->format('Y-m-d') : null,
                'end_date' => $schedule->end_date ? Carbon::parse((string) $schedule->end_date)->format('Y-m-d') : null,
                'slot_duration_minutes' => $schedule->slot_duration_minutes,
                'status' => $schedule->status,
                'notes' => $schedule->notes,
                'rules' => $schedule->rules->map(fn ($r) => [
                    'id' => $r->id,
                    'weekday' => $r->weekday,
                    'start_time' => substr((string) $r->start_time, 0, 5),
                    'end_time' => substr((string) $r->end_time, 0, 5),
                    'capacity' => $r->capacity,
                    'is_active' => $r->is_active,
                ])->values()->all(),
            ]);
    }

    private function getBlocksList(?int $professionalId, Carbon $dateFrom, Carbon $dateTo): array
    {
        return ProfessionalScheduleBlock::query()
            ->with('professional')
            ->when($professionalId, fn ($q) => $q->where('professional_id', $professionalId))
            ->where('start_datetime', '<=', $dateTo->copy()->endOfDay())
            ->where('end_datetime', '>=', $dateFrom->copy()->startOfDay())
            ->orderBy('start_datetime')
            ->get()
            ->map(fn (ProfessionalScheduleBlock $block) => [
                'id' => $block->id,
                'professional_id' => $block->professional_id,
                'professional_name' => $block->professional?->full_name,
                'block_type' => $block->block_type,
                'title' => $block->title,
                'start_datetime' => $block->start_datetime?->format('Y-m-d\TH:i'),
                'end_datetime' => $block->end_datetime?->format('Y-m-d\TH:i'),
                'affects_full_day' => $block->affects_full_day,
                'status' => $block->status,
                'notes' => $block->notes,
            ])
            ->values()
            ->all();
    }

    private function getAppointmentsList(?int $professionalId, Carbon $dateFrom, Carbon $dateTo, \Illuminate\Support\Collection $medicalServicesLookup): array
    {
        return ScheduleAppointment::query()
            ->with(['professional', 'patient', 'medicalService', 'serviceRequest'])
            ->when($professionalId, fn ($q) => $q->where('professional_id', $professionalId))
            ->whereDate('appointment_date', '>=', $dateFrom->toDateString())
            ->whereDate('appointment_date', '<=', $dateTo->toDateString())
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->get()
            ->map(fn (ScheduleAppointment $a) => $this->serializeAppointment($a, $medicalServicesLookup))
            ->values()
            ->all();
    }

    public function appointmentsIndex(Request $request): Response
    {
        $selectedDate = $request->filled('selected_date')
            ? Carbon::parse((string) $request->get('selected_date'))->startOfDay()
            : Carbon::today()->startOfDay();

        $view = $request->filled('view') && in_array((string) $request->get('view'), ['day', 'week', 'month'], true)
            ? (string) $request->get('view')
            : 'day';

        $professionalId = $request->filled('professional_id') ? (int) $request->get('professional_id') : null;

        [$rangeStart, $rangeEnd] = $this->resolveAppointmentsRange($selectedDate, $view);

        $professionals = $this->getProfessionalsList();
        $medicalServices = $this->getMedicalServicesList();
        $medicalServicesLookup = collect($medicalServices)->keyBy('id');

        $appointments = $this->getAppointmentsList($professionalId, $rangeStart, $rangeEnd, $medicalServicesLookup);
        $slotBoard = $this->scheduleService->getSlotBoardForRange($professionalId, $rangeStart, $rangeEnd);

        return Inertia::render('medical/schedule/Appointments', [
            'professionals' => $professionals,
            'medicalServices' => $medicalServices,
            'appointments' => $appointments,
            'slotBoard' => $slotBoard,
            'filters' => [
                'professional_id' => $professionalId,
                'selected_date' => $selectedDate->format('Y-m-d'),
                'view' => $view,
                'range_start' => $rangeStart->format('Y-m-d'),
                'range_end' => $rangeEnd->format('Y-m-d'),
            ],
        ]);
    }

    public function storeSchedule(Request $request): RedirectResponse
    {
        $validated = $this->validateSchedule($request);

        DB::transaction(function () use ($validated) {
            $schedule = ProfessionalSchedule::create([
                'professional_id' => $validated['professional_id'],
                'name' => $validated['name'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'slot_duration_minutes' => $validated['slot_duration_minutes'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $schedule->rules()->createMany($validated['rules']);
        });

        return back()->with('message', 'Agenda guardada correctamente.');
    }

    public function updateSchedule(Request $request, ProfessionalSchedule $schedule): RedirectResponse
    {
        $validated = $this->validateSchedule($request);

        DB::transaction(function () use ($schedule, $validated) {
            $schedule->update([
                'professional_id' => $validated['professional_id'],
                'name' => $validated['name'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'slot_duration_minutes' => $validated['slot_duration_minutes'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $schedule->rules()->delete();
            $schedule->rules()->createMany($validated['rules']);
        });

        return back()->with('message', 'Agenda actualizada correctamente.');
    }

    public function storeBlock(Request $request): RedirectResponse
    {
        if ($request->filled('cancel_block_ids')) {
            $validated = $request->validate([
                'cancel_block_ids' => ['required', 'array', 'min:1'],
                'cancel_block_ids.*' => ['integer', 'exists:professional_schedule_blocks,id'],
            ]);

            ProfessionalScheduleBlock::query()
                ->whereIn('id', $validated['cancel_block_ids'])
                ->update(['status' => ProfessionalScheduleBlock::STATUS_CANCELLED]);

            return back()->with('message', 'Bloqueos quitados correctamente.');
        }

        if ($request->filled('blocks')) {
            $validated = $request->validate([
                'blocks' => ['required', 'array', 'min:1'],
            ]);

            DB::transaction(function () use ($validated) {
                foreach ($validated['blocks'] as $blockPayload) {
                    validator($blockPayload, $this->blockValidationRules())->validate();
                    ProfessionalScheduleBlock::create($blockPayload);
                }
            });

            return back()->with('message', 'Bloqueos registrados correctamente.');
        }

        $validated = $this->validateBlock($request);

        ProfessionalScheduleBlock::create($validated);

        return back()->with('message', 'Bloqueo registrado correctamente.');
    }

    public function updateBlock(Request $request, ProfessionalScheduleBlock $block): RedirectResponse
    {
        $validated = $this->validateBlock($request);

        $block->update($validated);

        return back()->with('message', 'Bloqueo actualizado correctamente.');
    }

    public function storeAppointment(Request $request): RedirectResponse
    {
        $validated = $this->validateAppointment($request);

        $validation = $this->scheduleService->validateAppointmentSlot(
            $validated['professional_id'],
            Carbon::parse($validated['appointment_date']),
            $validated['start_time'],
            $validated['duration_minutes']
        );

        if (!$validation['valid']) {
            return back()->withErrors(['appointment_time' => $validation['message']])->withInput();
        }

        ScheduleAppointment::create($this->buildAppointmentPayload($validated));

        return back()->with('message', 'Cita registrada correctamente.');
    }

    public function updateAppointment(Request $request, ScheduleAppointment $appointment): RedirectResponse
    {
        $validated = $this->validateAppointment($request, $appointment);

        if ($validated['status'] !== ScheduleAppointment::STATUS_CANCELLED) {
            $validation = $this->scheduleService->validateAppointmentSlot(
                $validated['professional_id'],
                Carbon::parse($validated['appointment_date']),
                $validated['start_time'],
                $validated['duration_minutes'],
                $appointment->id
            );

            if (!$validation['valid']) {
                return back()->withErrors(['appointment_time' => $validation['message']])->withInput();
            }
        }

        $appointment->update($this->buildAppointmentPayload($validated));

        return back()->with('message', 'Cita actualizada correctamente.');
    }

    private function validateSchedule(Request $request): array
    {
        return $request->validate([
            'professional_id' => ['required', 'exists:professionals,id'],
            'name' => ['required', 'string', 'max:120'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'slot_duration_minutes' => ['required', 'integer', 'min:5', 'max:240'],
            'status' => ['required', Rule::in([ProfessionalSchedule::STATUS_ACTIVE, ProfessionalSchedule::STATUS_INACTIVE])],
            'notes' => ['nullable', 'string', 'max:1000'],
            'rules' => ['required', 'array', 'min:1'],
            'rules.*.weekday' => ['required', 'integer', 'between:0,6'],
            'rules.*.start_time' => ['required', 'date_format:H:i'],
            'rules.*.end_time' => ['required', 'date_format:H:i'],
            'rules.*.capacity' => ['required', 'integer', 'min:1', 'max:20'],
            'rules.*.is_active' => ['nullable', 'boolean'],
        ]);
    }

    private function validateBlock(Request $request): array
    {
        return $request->validate($this->blockValidationRules());
    }

    private function blockValidationRules(): array
    {
        return [
            'professional_id' => ['required', 'exists:professionals,id'],
            'block_type' => ['required', Rule::in(['travel', 'conference', 'holiday', 'vacation', 'other'])],
            'title' => ['required', 'string', 'max:120'],
            'start_datetime' => ['required', 'date'],
            'end_datetime' => ['required', 'date', 'after:start_datetime'],
            'affects_full_day' => ['required', 'boolean'],
            'status' => ['required', Rule::in([ProfessionalScheduleBlock::STATUS_ACTIVE, ProfessionalScheduleBlock::STATUS_CANCELLED])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    private function validateAppointment(Request $request, ?ScheduleAppointment $appointment = null): array
    {
        $validated = $request->validate([
            'professional_id' => ['required', 'exists:professionals,id'],
            'patient_id' => ['required', 'exists:patients,id'],
            'medical_service_id' => ['nullable', 'exists:medical_services,id'],
            'medical_service_ids' => ['nullable', 'array'],
            'medical_service_ids.*' => ['integer', 'exists:medical_services,id'],
            'appointment_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration_minutes' => ['nullable', 'integer', 'min:5', 'max:480'],
            'status' => ['required', Rule::in([
                ScheduleAppointment::STATUS_SCHEDULED,
                ScheduleAppointment::STATUS_CHECKED_IN,
                ScheduleAppointment::STATUS_COMPLETED,
                ScheduleAppointment::STATUS_CANCELLED,
                ScheduleAppointment::STATUS_NO_SHOW,
            ])],
            'source' => ['required', Rule::in([
                ScheduleAppointment::SOURCE_AGENDA,
                ScheduleAppointment::SOURCE_RECEPTION,
                ScheduleAppointment::SOURCE_MANUAL,
            ])],
            'notes' => ['nullable', 'string', 'max:1000'],
            'cancellation_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $serviceIds = collect($validated['medical_service_ids'] ?? [])
            ->when(!empty($validated['medical_service_id']), fn ($collection) => $collection->prepend((int) $validated['medical_service_id']))
            ->filter()
            ->map(fn ($serviceId) => (int) $serviceId)
            ->unique()
            ->values();

        $validated['medical_service_ids'] = $serviceIds->all();
        $validated['medical_service_id'] = $serviceIds->first();

        if (empty($validated['duration_minutes']) && $serviceIds->isNotEmpty()) {
            $validated['duration_minutes'] = (int) MedicalService::query()
                ->whereIn('id', $serviceIds->all())
                ->sum('duration_minutes');
        }

        if (empty($validated['duration_minutes'])) {
            $validated['duration_minutes'] = $appointment?->duration_minutes ?? 30;
        }

        return $validated;
    }

    private function buildAppointmentPayload(array $validated): array
    {
        $appointmentDate = Carbon::parse($validated['appointment_date']);
        $start = Carbon::parse($appointmentDate->format('Y-m-d') . ' ' . $validated['start_time']);
        $end = $start->copy()->addMinutes($validated['duration_minutes']);

        return [
            'professional_id' => $validated['professional_id'],
            'patient_id' => $validated['patient_id'],
            'medical_service_id' => $validated['medical_service_id'] ?? null,
            'medical_service_ids' => !empty($validated['medical_service_ids']) ? $validated['medical_service_ids'] : null,
            'appointment_date' => $validated['appointment_date'],
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'duration_minutes' => $validated['duration_minutes'],
            'status' => $validated['status'],
            'source' => $validated['source'],
            'notes' => $validated['notes'] ?? null,
            'cancellation_reason' => $validated['status'] === ScheduleAppointment::STATUS_CANCELLED
                ? ($validated['cancellation_reason'] ?? null)
                : null,
            'checked_in_at' => $validated['status'] === ScheduleAppointment::STATUS_CHECKED_IN ? now() : null,
            'completed_at' => $validated['status'] === ScheduleAppointment::STATUS_COMPLETED ? now() : null,
            'cancelled_at' => $validated['status'] === ScheduleAppointment::STATUS_CANCELLED ? now() : null,
        ];
    }

    private function serializeAppointment(ScheduleAppointment $appointment, $medicalServicesLookup): array
    {
        $serviceIds = collect($appointment->medical_service_ids ?? [])
            ->when($appointment->medical_service_id, fn ($collection) => $collection->prepend((int) $appointment->medical_service_id))
            ->filter()
            ->map(fn ($serviceId) => (int) $serviceId)
            ->unique()
            ->values();

        $serviceNames = $serviceIds
            ->map(function (int $serviceId) use ($medicalServicesLookup, $appointment) {
                $service = $medicalServicesLookup->get($serviceId);

                if (is_array($service) && !empty($service['name'])) {
                    return $service['name'];
                }

                if ($appointment->medical_service_id === $serviceId && $appointment->medicalService?->name) {
                    return $appointment->medicalService->name;
                }

                return null;
            })
            ->filter()
            ->values();

        return [
            'id' => $appointment->id,
            'professional_id' => $appointment->professional_id,
            'professional_name' => $appointment->professional?->full_name,
            'patient_id' => $appointment->patient_id,
            'patient_name' => $appointment->patient?->full_name,
            'medical_service_id' => $appointment->medical_service_id,
            'medical_service_ids' => $serviceIds->all(),
            'medical_service_name' => $serviceNames->implode(', '),
            'medical_service_names' => $serviceNames->all(),
            'service_request_id' => $appointment->service_request_id,
            'service_request_number' => $appointment->serviceRequest?->request_number,
            'service_request_status' => $appointment->serviceRequest?->status,
            'appointment_date' => $appointment->appointment_date ? Carbon::parse((string) $appointment->appointment_date)->format('Y-m-d') : null,
            'start_time' => substr((string) $appointment->start_time, 0, 5),
            'end_time' => substr((string) $appointment->end_time, 0, 5),
            'duration_minutes' => $appointment->duration_minutes,
            'status' => $appointment->status,
            'source' => $appointment->source,
            'notes' => $appointment->notes,
            'cancellation_reason' => $appointment->cancellation_reason,
        ];
    }

    private function resolveAppointmentsRange(Carbon $selectedDate, string $view): array
    {
        return match ($view) {
            'week' => [
                $selectedDate->copy()->startOfWeek(CarbonInterface::MONDAY),
                $selectedDate->copy()->endOfWeek(CarbonInterface::SUNDAY)->startOfDay(),
            ],
            'month' => [
                $selectedDate->copy()->startOfMonth()->startOfWeek(CarbonInterface::MONDAY),
                $selectedDate->copy()->endOfMonth()->endOfWeek(CarbonInterface::SUNDAY)->startOfDay(),
            ],
            default => [$selectedDate->copy()->startOfDay(), $selectedDate->copy()->startOfDay()],
        };
    }
}