<?php
namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Laboratory\StoreLabValidationRequest;
use App\DTOs\Laboratory\LabValidationDTO;
use App\Models\Laboratory\LabValidation;
use App\Services\Laboratory\LabValidationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LabValidationController extends Controller
{
    public function index(): Response
    {
        $validations = LabValidation::with(['sample', 'validatedBy'])->latest()->paginate(20);
        return Inertia::render('laboratory/validations/Index', [
            'validations' => $validations,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('laboratory/validations/Create');
    }

    public function store(StoreLabValidationRequest $request, LabValidationService $service): RedirectResponse
    {
        $dto = new LabValidationDTO(...$request->validated());
        $service->store($dto);
        return redirect()->route('laboratory.validations.index')->with('success', 'Validación registrada');
    }

    public function show(LabValidation $validation): Response
    {
        $validation->load(['sample', 'validatedBy']);
        return Inertia::render('laboratory/validations/Show', [
            'validation' => $validation,
        ]);
    }

    public function edit(LabValidation $validation): Response
    {
        return Inertia::render('laboratory/validations/Edit', [
            'validation' => $validation,
        ]);
    }

    public function update(StoreLabValidationRequest $request, LabValidation $validation, LabValidationService $service): RedirectResponse
    {
        $dto = new LabValidationDTO(...$request->validated());
        $service->update($validation, $dto);
        return redirect()->route('laboratory.validations.index')->with('success', 'Validación actualizada');
    }

    public function destroy(LabValidation $validation): RedirectResponse
    {
        $validation->delete();
        return redirect()->route('laboratory.validations.index')->with('success', 'Validación eliminada');
    }
}
