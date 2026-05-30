<?php
namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Laboratory\StoreLabResultRequest;
use App\DTOs\Laboratory\LabResultDTO;
use App\Models\Laboratory\LabResult;
use App\Services\Laboratory\LabResultService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LabResultController extends Controller
{
    public function index(): Response
    {
        $results = LabResult::with(['sample', 'parameter', 'equipment'])->latest()->paginate(20);
        return Inertia::render('laboratory/results/Index', [
            'results' => $results,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('laboratory/results/Create');
    }

    public function store(StoreLabResultRequest $request, LabResultService $service): RedirectResponse
    {
        $dto = new LabResultDTO(...$request->validated());
        $service->store($dto);
        return redirect()->route('laboratory.results.index')->with('success', 'Resultado registrado');
    }

    public function show(LabResult $result): Response
    {
        $result->load(['sample', 'parameter', 'equipment']);
        return Inertia::render('laboratory/results/Show', [
            'result' => $result,
        ]);
    }

    public function edit(LabResult $result): Response
    {
        return Inertia::render('laboratory/results/Edit', [
            'result' => $result,
        ]);
    }

    public function update(StoreLabResultRequest $request, LabResult $result, LabResultService $service): RedirectResponse
    {
        $dto = new LabResultDTO(...$request->validated());
        $service->update($result, $dto);
        return redirect()->route('laboratory.results.index')->with('success', 'Resultado actualizado');
    }

    public function destroy(LabResult $result): RedirectResponse
    {
        $result->delete();
        return redirect()->route('laboratory.results.index')->with('success', 'Resultado eliminado');
    }
}
