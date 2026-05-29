<?php

namespace App\Http\Controllers;

use App\Events\PatientCalled;
use App\Events\PatientEnteredQueue;
use App\Events\PatientFinished;
use App\Events\PatientInConsultation;
use App\Models\ConsultationQueue;
//use App\Models\Patient;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConsultationQueueController extends Controller
{
    /**
     * Show the authenticated doctor's queue.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !method_exists($user, 'hasRole') || !$user->hasRole('doctor')) {
            abort(403);
        }

        $perPage = (int) $request->get('per_page', 20);

        $query = ConsultationQueue::with(['patient'])
            ->where('doctor_id', $user->id)
            ->orderByRaw("FIELD(priority,'urgent','normal')")
            ->orderBy('created_at');

        $queue = $query->paginate($perPage)->through(function ($item) {
            return [
                'id' => $item->id,
                'patient' => [
                    'id' => $item->patient->id,
                    'first_name' => $item->patient->first_name,
                    'last_name' => $item->patient->last_name,
                    'display' => $item->patient->full_name ?? ($item->patient->first_name . ' ' . $item->patient->last_name),
                ],
                'status' => $item->status,
                'priority' => $item->priority,
                'created_at' => $item->created_at->toDateTimeString(),
            ];
        });

        return Inertia::render('medical/consultorio/QueueIndex', [
            'queue' => $queue,
        ]);
    }

    /**
     * Store a new queue entry (used by reception or manual send).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'reception_id' => 'nullable|exists:service_requests,id',
            'doctor_id' => 'required|exists:users,id',
            'priority' => 'nullable', // accept integer or string ('normal'|'urgent')
        ]);

        $serviceRequest = null;
        if (!empty($validated['reception_id'])) {
            $serviceRequest = ServiceRequest::find($validated['reception_id']);
        }

        // Only allow send-to-consultorio if the service is paid or sender has explicit permission
        if ($serviceRequest && !$serviceRequest->isFullyPaid() && !$request->user()->can('send-to-consultorio')) {
            return redirect()->back()->withErrors('Solo se puede enviar a consultorio si el servicio está pago o tiene permiso.');
        }
        $priority = 'normal';
        if (isset($validated['priority'])) {
            $p = $validated['priority'];
            if (is_numeric($p)) {
                $priority = ((int)$p > 0) ? 'urgent' : 'normal';
            } elseif (in_array($p, ['normal', 'urgent'])) {
                $priority = $p;
            }
        }

        // Avoid creating duplicate queue entries for the same reception. If an active
        // entry exists, update it instead (doctor/priority), otherwise create.
        if (!empty($validated['reception_id'])) {
            $existing = ConsultationQueue::where('reception_id', $validated['reception_id'])
                ->whereIn('status', ['waiting', 'called', 'in_consultation'])
                ->first();

            if ($existing) {
                // If nothing changed, inform the user
                if ($existing->doctor_id == $validated['doctor_id'] && $existing->priority == $priority) {
                    return redirect()->back()->with('info', 'El paciente ya está en la cola de consultorio.');
                }

                $existing->doctor_id = $validated['doctor_id'];
                $existing->priority = $priority;
                $existing->save();

                // Notify listeners about the update
                broadcast(new PatientEnteredQueue($existing))->toOthers();

                return redirect()->back()->with('success', 'Entrada de cola actualizada correctamente.');
            }
        }

        $entry = ConsultationQueue::create([
            'patient_id' => $validated['patient_id'],
            'reception_id' => $validated['reception_id'] ?? null,
            'doctor_id' => $validated['doctor_id'],
            'priority' => $priority,
            'status' => 'waiting',
        ]);

        broadcast(new PatientEnteredQueue($entry))->toOthers();

        return redirect()->back()->with('success', 'Paciente enviado a la cola de consultorio.');
    }

   public function call(ConsultationQueue $consultation)
{
    $user = auth()->user();
    if (!$user || $consultation->doctor_id !== $user->id) abort(403);

    $consultation->update([
        'status' => 'called',
        'called_at' => now(),
    ]);

    $patientName = $consultation->patient->full_name ?? ($consultation->patient->first_name . ' ' . $consultation->patient->last_name);

    broadcast(new PatientCalled(
        $consultation->id,
        $patientName,
        $user->id,
        $user->name
    ))->toOthers();

    return redirect()->back();
}

    public function start(ConsultationQueue $consultation)
    {
        $user = auth()->user();
        if (!$user || $consultation->doctor_id !== $user->id) abort(403);

        $consultation->update([
            'status' => 'in_consultation',
            'started_at' => now(),
        ]);

        event(new PatientInConsultation($consultation));

        // Redirect to the medical record creation for the patient (preloaded patient)
        return redirect()->route('medical.patients.medical-records.create', $consultation->patient_id)->with('from_queue', true);
    }

    public function finish(ConsultationQueue $consultation)
    {
        $user = auth()->user();
        if (!$user || $consultation->doctor_id !== $user->id) abort(403);

        $consultation->update([
            'status' => 'done',
            'finished_at' => now(),
        ]);

        event(new PatientFinished($consultation));

        return redirect()->back();
    }

    /**
     * Call the next patient in queue for the authenticated doctor.
     */
    public function callNext(Request $request)
    {
        $user = $request->user();
        if (!$user || !method_exists($user, 'hasRole') || !$user->hasRole('doctor')) abort(403);

        $next = ConsultationQueue::with('patient')
            ->where('doctor_id', $user->id)
            ->where('status', 'waiting')
            ->orderByRaw("FIELD(priority,'urgent','normal')")
            ->orderBy('created_at')
            ->first();

        if (!$next) return redirect()->back()->with('info', 'No hay pacientes en espera');

        $next->update(['status' => 'called', 'called_at' => now()]);
        $patientName = $next->patient->full_name ?? ($next->patient->first_name . ' ' . $next->patient->last_name);
        event(new PatientCalled(
            $next->id,
            $patientName,
            $user->id,
            $user->name
        ));

        return redirect()->back()->with('success', 'Paciente llamado: ' . ($next->patient->full_name ?? ''));
    }

    /**
     * Public waiting room (TV / monitor) view.
     */
    public function waitingRoom(Request $request)
    {
        $inConsultation = ConsultationQueue::with(['patient','doctor'])
            ->where('status', 'in_consultation')
            ->get()
            ->map(function ($i) {
                return [
                    'id' => $i->id,
                    'patient' => $i->patient?->full_name ?? null,
                    'doctor' => $i->doctor?->name ?? null,
                    'started_at' => $i->started_at?->toDateTimeString(),
                ];
            });

        $lastCalled = ConsultationQueue::with('patient')
            ->where('status', 'called')
            ->latest('called_at')
            ->limit(5)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'patient' => $c->patient?->full_name ?? null,
                'called_at' => $c->called_at?->toDateTimeString(),
            ]);

        $waiting = ConsultationQueue::with('patient')
            ->where('status', 'waiting')
            ->orderByRaw("FIELD(priority,'urgent','normal')")
            ->orderBy('created_at')
            ->get()
            ->map(fn($w) => [
                'id' => $w->id,
                'patient' => $w->patient?->full_name ?? null,
                'priority' => $w->priority,
            ]);

        return Inertia::render('medical/consultorio/WaitingRoom', [
            'in_consultation' => $inConsultation,
            'last_called' => $lastCalled,
            'waiting' => $waiting,
        ]);
    }
}
