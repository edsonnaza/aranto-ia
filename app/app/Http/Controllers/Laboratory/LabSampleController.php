<?php
namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Laboratory\StoreLabSampleRequest;
use App\DTOs\Laboratory\LabSampleDTO;
use App\Models\Laboratory\LabSample;
use App\Services\Laboratory\LabSampleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LabSampleController extends Controller
{
    public function index(): Response
    {
        $samples = LabSample::with('serviceRequestDetail')->latest()->paginate(20);
        return Inertia::render('laboratory/samples/Index', [
            'samples' => $samples,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('laboratory/samples/Create');
    }

    public function store(StoreLabSampleRequest $request, LabSampleService $service): RedirectResponse
    {
        $dto = new LabSampleDTO(...$request->validated());
        $sample = $service->store($dto);
        return redirect()->route('laboratory.samples.index')->with('success', 'Muestra registrada');
    }

    public function show(LabSample $sample): Response
    {
        $sample->load('serviceRequestDetail');
        return Inertia::render('laboratory/samples/Show', [
            'sample' => $sample,
        ]);
    }

    public function edit(LabSample $sample): Response
    {
        return Inertia::render('laboratory/samples/Edit', [
            'sample' => $sample,
        ]);
    }

    public function update(StoreLabSampleRequest $request, LabSample $sample, LabSampleService $service): RedirectResponse
    {
        $dto = new LabSampleDTO(...$request->validated());
        $service->update($sample, $dto);
        return redirect()->route('laboratory.samples.index')->with('success', 'Muestra actualizada');
    }

    public function destroy(LabSample $sample): RedirectResponse
    {
        $sample->delete();
        return redirect()->route('laboratory.samples.index')->with('success', 'Muestra eliminada');
    }
}
