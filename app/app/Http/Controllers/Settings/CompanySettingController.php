<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\CompanySettingRequest;
use App\Models\CompanySetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingController extends Controller
{
    public function edit(Request $request): Response
    {
        $company = CompanySetting::current();

        return Inertia::render('settings/company', [
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
                'ruc' => $company->ruc,
                'logo_path' => $company->logo_path,
                'logo_url' => $company->logo_url,
                'legal_representative' => $company->legal_representative,
                'phone' => $company->phone,
                'email' => $company->email,
            ] : null,
        ]);
    }

    public function update(CompanySettingRequest $request): RedirectResponse
    {
        $company = CompanySetting::query()->first() ?? new CompanySetting();
        $oldLogoPath = $company->logo_path;

        $company->fill($request->safe()->except('logo'));

        if ($request->hasFile('logo')) {
            if ($oldLogoPath) {
                Storage::disk('public')->delete($oldLogoPath);
            }

            $company->logo_path = $request->file('logo')->store('company', 'public');
        }

        $company->save();

        return to_route('company-settings.edit')->with('message', 'Configuracion de empresa actualizada correctamente.');
    }
}