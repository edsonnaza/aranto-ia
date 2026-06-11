<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\ExternalLaboratory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExternalLaboratoryController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ExternalLaboratory::query()->withCount('testRequests');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('whatsapp', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $externalLaboratories = $query
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('laboratory/external-laboratories/Index', [
            'externalLaboratories' => $externalLaboratories,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('laboratory/external-laboratories/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateExternalLaboratory($request);

        ExternalLaboratory::create($validated);

        return redirect()
            ->route('medical.laboratory.external-laboratories.index')
            ->with('success', 'Laboratorio externo creado exitosamente.');
    }

    public function edit(ExternalLaboratory $externalLaboratory): Response
    {
        return Inertia::render('laboratory/external-laboratories/Edit', [
            'externalLaboratory' => $externalLaboratory,
        ]);
    }

    public function update(Request $request, ExternalLaboratory $externalLaboratory): RedirectResponse
    {
        $validated = $this->validateExternalLaboratory($request, $externalLaboratory);

        $externalLaboratory->update($validated);

        return redirect()
            ->route('medical.laboratory.external-laboratories.index')
            ->with('success', 'Laboratorio externo actualizado exitosamente.');
    }

    public function destroy(ExternalLaboratory $externalLaboratory): RedirectResponse
    {
        if ($externalLaboratory->testRequests()->exists()) {
            return redirect()
                ->route('medical.laboratory.external-laboratories.index')
                ->with('error', 'No se puede eliminar el laboratorio porque tiene estudios vinculados.');
        }

        $externalLaboratory->delete();

        return redirect()
            ->route('medical.laboratory.external-laboratories.index')
            ->with('success', 'Laboratorio externo eliminado exitosamente.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateExternalLaboratory(
        Request $request,
        ?ExternalLaboratory $externalLaboratory = null
    ): array {
        return $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'contact_name' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'whatsapp' => ['nullable', 'string', 'max:50'],
            'email' => [
                'nullable',
                'email',
                'max:150',
                Rule::unique('external_laboratories', 'email')->ignore($externalLaboratory?->id),
            ],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);
    }
}
