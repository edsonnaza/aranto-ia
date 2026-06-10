<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabArea;
use App\Models\Laboratory\LabEquipment;
use App\Models\Laboratory\LabProfileEquipment;
use App\Models\Laboratory\LabTestParameter;
use App\Models\Laboratory\LabTestProfile;
use App\Models\MedicalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LabTestProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $query = LabTestProfile::query()->with(['medicalService', 'area', 'parameters', 'profileEquipments.equipment']);

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

        if ($request->area_id) {
            $query->where('lab_area_id', $request->area_id);
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
            'areas' => LabArea::query()
                ->where('status', 'active')
                ->orderBy('display_order')
                ->get(['id', 'name', 'code']),
            'filters' => $request->only(['search', 'status', 'area_id']),
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
            'areas' => $this->activeAreas(),
            'services' => $this->labServices(),
            'equipments' => $this->activeEquipments(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'medical_service_id' => ['required', 'exists:medical_services,id'],
            'lab_area_id' => ['nullable', 'exists:lab_areas,id'],
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
            'parameters.*.reference_ranges' => ['nullable', 'array'],
            'parameters.*.reference_ranges.*.gender' => ['nullable', Rule::in(['male', 'female', 'all'])],
            'parameters.*.reference_ranges.*.age_min' => ['nullable', 'integer', 'min:0', 'max:150'],
            'parameters.*.reference_ranges.*.age_max' => ['nullable', 'integer', 'min:0', 'max:150'],
            'parameters.*.reference_ranges.*.min_value' => ['nullable', 'numeric'],
            'parameters.*.reference_ranges.*.max_value' => ['nullable', 'numeric'],
            'parameters.*.reference_ranges.*.reference_text' => ['nullable', 'string', 'max:255'],
        ]);

        $this->validateEquipmentSelection(
            $validated['lab_area_id'] ?? null,
            $validated['equipment_ids'] ?? [],
            $validated['default_equipment_id'] ?? null,
        );

        DB::transaction(function () use ($validated) {
            $profile = LabTestProfile::create([
                'medical_service_id' => $validated['medical_service_id'],
                'lab_area_id' => $validated['lab_area_id'] ?? null,
                'name' => $validated['name'],
                'code' => strtoupper(trim($validated['code'])),
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'],
                'validation_type' => $validated['validation_type'],
                'validation_target' => $validated['validation_target'] ?? 100,
                'validation_tolerance' => $validated['validation_tolerance'] ?? 0,
            ]);

            foreach ($validated['parameters'] as $index => $parameter) {
                $createdParameter = LabTestParameter::create([
                    'lab_test_profile_id' => $profile->id,
                    'name' => $parameter['name'],
                    'code' => strtoupper(trim($parameter['code'])),
                    'parameter_type' => $parameter['parameter_type'],
                    'unit' => $parameter['unit'] ?? null,
                    'display_order' => $index + 1,
                    'is_required' => (bool) ($parameter['is_required'] ?? true),
                    'status' => 'active',
                    'include_in_sum_100' => (bool) ($parameter['include_in_sum_100'] ?? false),
                    'formula' => $parameter['formula'] ?? null,
                ]);

                foreach ($this->sanitizeReferenceRanges($parameter['reference_ranges'] ?? []) as $range) {
                    $createdParameter->referenceRanges()->create($range);
                }
            }

            $this->syncProfileEquipments(
                $profile,
                $validated['equipment_ids'] ?? [],
                $validated['default_equipment_id'] ?? null,
            );
        });

        return redirect()
            ->route('medical.laboratory.test-profiles.index')
            ->with('success', 'Perfil de laboratorio creado exitosamente.');
    }

    public function edit(LabTestProfile $testProfile): Response
    {
        $testProfile->load(['area', 'parameters.referenceRanges', 'profileEquipments']);

        return Inertia::render('laboratory/test-profiles/Edit', [
            'profile' => $testProfile,
            'areas' => $this->activeAreas(),
            'services' => $this->labServices(),
            'equipments' => $this->activeEquipments(),
        ]);
    }

    public function update(Request $request, LabTestProfile $testProfile): RedirectResponse
    {
        $validated = $request->validate([
            'medical_service_id' => ['required', 'exists:medical_services,id'],
            'lab_area_id' => ['nullable', 'exists:lab_areas,id'],
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
            'parameters.*.reference_ranges' => ['nullable', 'array'],
            'parameters.*.reference_ranges.*.gender' => ['nullable', Rule::in(['male', 'female', 'all'])],
            'parameters.*.reference_ranges.*.age_min' => ['nullable', 'integer', 'min:0', 'max:150'],
            'parameters.*.reference_ranges.*.age_max' => ['nullable', 'integer', 'min:0', 'max:150'],
            'parameters.*.reference_ranges.*.min_value' => ['nullable', 'numeric'],
            'parameters.*.reference_ranges.*.max_value' => ['nullable', 'numeric'],
            'parameters.*.reference_ranges.*.reference_text' => ['nullable', 'string', 'max:255'],
        ]);

        $this->validateEquipmentSelection(
            $validated['lab_area_id'] ?? null,
            $validated['equipment_ids'] ?? [],
            $validated['default_equipment_id'] ?? null,
        );

        DB::transaction(function () use ($validated, $testProfile) {
            $testProfile->update([
                'medical_service_id' => $validated['medical_service_id'],
                'lab_area_id' => $validated['lab_area_id'] ?? null,
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
                $createdParameter = LabTestParameter::create([
                    'lab_test_profile_id' => $testProfile->id,
                    'name' => $parameter['name'],
                    'code' => strtoupper(trim($parameter['code'])),
                    'parameter_type' => $parameter['parameter_type'],
                    'unit' => $parameter['unit'] ?? null,
                    'display_order' => $index + 1,
                    'is_required' => (bool) ($parameter['is_required'] ?? true),
                    'status' => 'active',
                    'include_in_sum_100' => (bool) ($parameter['include_in_sum_100'] ?? false),
                    'formula' => $parameter['formula'] ?? null,
                ]);

                foreach ($this->sanitizeReferenceRanges($parameter['reference_ranges'] ?? []) as $range) {
                    $createdParameter->referenceRanges()->create($range);
                }
            }

            $this->syncProfileEquipments(
                $testProfile,
                $validated['equipment_ids'] ?? [],
                $validated['default_equipment_id'] ?? null,
            );
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
        $areasByCode = LabArea::query()
            ->get(['id', 'code'])
            ->keyBy('code');

        return MedicalService::query()
            ->where('status', 'active')
            ->where('code', 'like', 'LAB-%')
            ->with('category:id,name')
            ->select('id', 'name', 'code', 'category_id')
            ->orderBy('name')
            ->get()
            ->map(function (MedicalService $service) use ($areasByCode) {
                $areaCode = $this->inferAreaCodeFromService($service);
                $area = $areaCode ? $areasByCode->get($areaCode) : null;

                return [
                    'id' => $service->id,
                    'name' => $service->name,
                    'code' => $service->code,
                    'lab_area_id' => $area?->id,
                    'lab_area_code' => $area?->code,
                ];
            })
            ->values();
    }

    private function activeEquipments()
    {
        return LabEquipment::query()
            ->where('status', 'active')
            ->select('id', 'name', 'code', 'lab_area_id')
            ->orderBy('name')
            ->get();
    }

    private function activeAreas()
    {
        return LabArea::query()
            ->where('status', 'active')
            ->orderBy('display_order')
            ->get(['id', 'name', 'code']);
    }

    private function validateEquipmentSelection(?int $labAreaId, array $equipmentIds, ?int $defaultEquipmentId): void
    {
        $labAreaId = $labAreaId !== null ? (int) $labAreaId : null;
        $defaultEquipmentId = $defaultEquipmentId !== null ? (int) $defaultEquipmentId : null;
        $equipmentIds = array_values(array_unique(array_map('intval', $equipmentIds)));

        if ($defaultEquipmentId !== null && ! in_array($defaultEquipmentId, $equipmentIds, true)) {
            throw ValidationException::withMessages([
                'default_equipment_id' => 'El equipo por defecto debe estar seleccionado en la lista de equipos.',
            ]);
        }

        if ($equipmentIds === []) {
            return;
        }

        $equipments = LabEquipment::query()
            ->whereIn('id', $equipmentIds)
            ->get(['id', 'lab_area_id']);

        if ($equipments->count() !== count($equipmentIds)) {
            throw ValidationException::withMessages([
                'equipment_ids' => 'Uno o mas equipos seleccionados no existen.',
            ]);
        }

        if ($labAreaId === null) {
            return;
        }

        $invalidEquipment = $equipments->first(function (LabEquipment $equipment) use ($labAreaId) {
            return $equipment->lab_area_id !== null && $equipment->lab_area_id !== $labAreaId;
        });

        if ($invalidEquipment) {
            throw ValidationException::withMessages([
                'equipment_ids' => 'Solo se pueden vincular equipos del area seleccionada o equipos compartidos sin area.',
            ]);
        }
    }

    private function syncProfileEquipments(LabTestProfile $testProfile, array $equipmentIds, ?int $defaultEquipmentId): void
    {
        $defaultEquipmentId = $defaultEquipmentId !== null ? (int) $defaultEquipmentId : null;
        $equipmentIds = array_values(array_unique(array_map('intval', $equipmentIds)));

        $testProfile->profileEquipments()->delete();

        foreach ($equipmentIds as $equipmentId) {
            LabProfileEquipment::create([
                'lab_test_profile_id' => $testProfile->id,
                'lab_equipment_id' => $equipmentId,
                'is_default' => $defaultEquipmentId !== null && $defaultEquipmentId === $equipmentId,
            ]);
        }
    }

    private function inferAreaCodeFromService(MedicalService $service): ?string
    {
        $categoryName = $service->category?->name;

        return match ($categoryName) {
            'Hematología', 'Coagulación', 'Metabolismo del Hierro' => 'HEMA',
            'Bioquímica General', 'Hepatología', 'Orina y Riñón' => 'BIO',
            'Endocrinología / Hormonas', 'Serología e Inmunología' => 'INMU',
            'Microbiología y Cultivos' => 'MICRO',
            default => null,
        };
    }

    /**
     * @param  array<int, array<string, mixed>>  $referenceRanges
     * @return array<int, array<string, mixed>>
     */
    private function sanitizeReferenceRanges(array $referenceRanges): array
    {
        return collect($referenceRanges)
            ->map(function (array $range) {
                $referenceText = isset($range['reference_text']) ? trim((string) $range['reference_text']) : null;

                return [
                    'gender' => $range['gender'] ?? 'all',
                    'age_min' => ($range['age_min'] ?? '') === '' ? null : (int) $range['age_min'],
                    'age_max' => ($range['age_max'] ?? '') === '' ? null : (int) $range['age_max'],
                    'min_value' => ($range['min_value'] ?? '') === '' ? null : $range['min_value'],
                    'max_value' => ($range['max_value'] ?? '') === '' ? null : $range['max_value'],
                    'reference_text' => $referenceText !== '' ? $referenceText : null,
                ];
            })
            ->filter(fn (array $range) => $range['age_min'] !== null
                || $range['age_max'] !== null
                || $range['min_value'] !== null
                || $range['max_value'] !== null
                || $range['reference_text'] !== null)
            ->values()
            ->all();
    }
}
