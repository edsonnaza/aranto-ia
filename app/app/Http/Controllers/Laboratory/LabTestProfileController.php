<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabEquipment;
use App\Models\Laboratory\LabProfileEquipment;
use App\Models\Laboratory\LabTestParameter;
use App\Models\Laboratory\LabTestProfile;
use App\Models\MedicalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LabTestProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $query = LabTestProfile::query()->with(['medicalService', 'parameters', 'profileEquipments.equipment']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('code', 'like', "%{$request->search}%")
                    ->orWhereHas('medicalService', function ($serviceQuery) use ($request) {
                        $serviceQuery->where('name', 'like', "%{$request->search}%")
                            ->orWhere('code', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $profiles = $query->orderBy('name')->paginate(20)->withQueryString();

        $allLabServices = MedicalService::query()
            ->where('status', 'active')
            ->where('code', 'like', 'LAB-%')
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        $configuredServiceIds = LabTestProfile::query()->pluck('medical_service_id')->all();

        return Inertia::render('laboratory/test-profiles/Index', [
            'profiles' => $profiles,
            'filters' => $request->only(['search', 'status']),
            'stats' => [
                'totalLabServices' => $allLabServices->count(),
                'configuredServices' => count(array_unique($configuredServiceIds)),
                'pendingServices' => $allLabServices->whereNotIn('id', $configuredServiceIds)->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('laboratory/test-profiles/Create', [
            'services' => $this->labServices(),
            'equipments' => $this->activeEquipments(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'medical_service_id' => ['required', 'exists:medical_services,id'],
            'name' => ['required', 'string', 'max:200'],
            'code' => ['required', 'string', 'max:50', 'unique:lab_test_profiles,code'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'validation_type' => ['required', Rule::in(['none', 'sum_100'])],
            'validation_target' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'validation_tolerance' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'equipment_ids' => ['nullable', 'array'],
            'equipment_ids.*' => ['integer', 'exists:lab_equipments,id'],
            'default_equipment_id' => ['nullable', 'integer', 'exists:lab_equipments,id'],
            'parameters' => ['required', 'array', 'min:1'],
            'parameters.*.name' => ['required', 'string', 'max:200'],
            'parameters.*.code' => ['required', 'string', 'max:50'],
            'parameters.*.parameter_type' => ['required', Rule::in(['numeric', 'text', 'option', 'calculated'])],
            'parameters.*.unit' => ['nullable', 'string', 'max:50'],
            'parameters.*.is_required' => ['nullable', 'boolean'],
            'parameters.*.include_in_sum_100' => ['nullable', 'boolean'],
            'parameters.*.formula' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated) {
            $profile = LabTestProfile::create([
                'medical_service_id' => $validated['medical_service_id'],
                'name' => $validated['name'],
                'code' => strtoupper(trim($validated['code'])),
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'],
                'validation_type' => $validated['validation_type'],
                'validation_target' => $validated['validation_target'] ?? 100,
                'validation_tolerance' => $validated['validation_tolerance'] ?? 0,
            ]);

            foreach ($validated['parameters'] as $index => $parameter) {
                LabTestParameter::create([
                    'lab_test_profile_id' => $profile->id,
                    'name' => $parameter['name'],
                    'code' => strtoupper(trim($parameter['code'])),
                    'parameter_type' => $parameter['parameter_type'],
                    'unit' => $parameter['unit'] ?? null,
                    'display_order' => $index + 1,
                    'is_required' => (bool) ($parameter['is_required'] ?? true),
                    'include_in_sum_100' => (bool) ($parameter['include_in_sum_100'] ?? false),
                    'formula' => $parameter['formula'] ?? null,
                ]);
            }

            $equipmentIds = collect($validated['equipment_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->values()->all();
            $defaultEquipmentId = isset($validated['default_equipment_id']) ? (int) $validated['default_equipment_id'] : null;

            foreach ($equipmentIds as $equipmentId) {
                LabProfileEquipment::create([
                    'lab_test_profile_id' => $profile->id,
                    'lab_equipment_id' => $equipmentId,
                    'is_default' => $defaultEquipmentId === $equipmentId,
                ]);
            }
        });

        return redirect()
            ->route('medical.laboratory.test-profiles.index')
            ->with('success', 'Perfil de laboratorio creado exitosamente.');
    }

    public function edit(LabTestProfile $testProfile): Response
    {
        $testProfile->load(['parameters', 'profileEquipments']);

        return Inertia::render('laboratory/test-profiles/Edit', [
            'profile' => $testProfile,
            'services' => $this->labServices(),
            'equipments' => $this->activeEquipments(),
        ]);
    }

    public function update(Request $request, LabTestProfile $testProfile): RedirectResponse
    {
        $validated = $request->validate([
            'medical_service_id' => ['required', 'exists:medical_services,id'],
            'name' => ['required', 'string', 'max:200'],
            'code' => ['required', 'string', 'max:50', Rule::unique('lab_test_profiles', 'code')->ignore($testProfile->id)],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'validation_type' => ['required', Rule::in(['none', 'sum_100'])],
            'validation_target' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'validation_tolerance' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'equipment_ids' => ['nullable', 'array'],
            'equipment_ids.*' => ['integer', 'exists:lab_equipments,id'],
            'default_equipment_id' => ['nullable', 'integer', 'exists:lab_equipments,id'],
            'parameters' => ['required', 'array', 'min:1'],
            'parameters.*.name' => ['required', 'string', 'max:200'],
            'parameters.*.code' => ['required', 'string', 'max:50'],
            'parameters.*.parameter_type' => ['required', Rule::in(['numeric', 'text', 'option', 'calculated'])],
            'parameters.*.unit' => ['nullable', 'string', 'max:50'],
            'parameters.*.is_required' => ['nullable', 'boolean'],
            'parameters.*.include_in_sum_100' => ['nullable', 'boolean'],
            'parameters.*.formula' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated, $testProfile) {
            $testProfile->update([
                'medical_service_id' => $validated['medical_service_id'],
                'name' => $validated['name'],
                'code' => strtoupper(trim($validated['code'])),
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'],
                'validation_type' => $validated['validation_type'],
                'validation_target' => $validated['validation_target'] ?? 100,
                'validation_tolerance' => $validated['validation_tolerance'] ?? 0,
            ]);

            $testProfile->parameters()->delete();

            foreach ($validated['parameters'] as $index => $parameter) {
                LabTestParameter::create([
                    'lab_test_profile_id' => $testProfile->id,
                    'name' => $parameter['name'],
                    'code' => strtoupper(trim($parameter['code'])),
                    'parameter_type' => $parameter['parameter_type'],
                    'unit' => $parameter['unit'] ?? null,
                    'display_order' => $index + 1,
                    'is_required' => (bool) ($parameter['is_required'] ?? true),
                    'include_in_sum_100' => (bool) ($parameter['include_in_sum_100'] ?? false),
                    'formula' => $parameter['formula'] ?? null,
                ]);
            }

            $testProfile->profileEquipments()->delete();

            $equipmentIds = collect($validated['equipment_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->values()->all();
            $defaultEquipmentId = isset($validated['default_equipment_id']) ? (int) $validated['default_equipment_id'] : null;

            foreach ($equipmentIds as $equipmentId) {
                LabProfileEquipment::create([
                    'lab_test_profile_id' => $testProfile->id,
                    'lab_equipment_id' => $equipmentId,
                    'is_default' => $defaultEquipmentId === $equipmentId,
                ]);
            }
        });

        return redirect()
            ->route('medical.laboratory.test-profiles.index')
            ->with('success', 'Perfil de laboratorio actualizado exitosamente.');
    }

    public function destroy(LabTestProfile $testProfile): RedirectResponse
    {
        if ($testProfile->parameters()->count() > 0) {
            $testProfile->parameters()->delete();
        }

        if ($testProfile->profileEquipments()->count() > 0) {
            $testProfile->profileEquipments()->delete();
        }

        $testProfile->delete();

        return redirect()
            ->route('medical.laboratory.test-profiles.index')
            ->with('success', 'Perfil de laboratorio eliminado exitosamente.');
    }

    private function labServices()
    {
        return MedicalService::query()
            ->where('status', 'active')
            ->where('code', 'like', 'LAB-%')
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();
    }

    private function activeEquipments()
    {
        return LabEquipment::query()
            ->where('status', 'active')
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();
    }
}
