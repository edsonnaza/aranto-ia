<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $company = CompanySetting::current();
        $logoDataUrl = null;

        if ($company?->logo_path && Storage::disk('public')->exists($company->logo_path)) {
            $extension = strtolower(pathinfo($company->logo_path, PATHINFO_EXTENSION));
            $mimeType = match ($extension) {
                'png' => 'image/png',
                'webp' => 'image/webp',
                'gif' => 'image/gif',
                'svg' => 'image/svg+xml',
                default => 'image/jpeg',
            };
            $logoDataUrl = sprintf(
                'data:%s;base64,%s',
                $mimeType,
                base64_encode(Storage::disk('public')->get($company->logo_path)),
            );
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
                'ruc' => $company->ruc,
                'logo_path' => $company->logo_path,
                'logo_url' => $company->logo_url,
                'logo_data_url' => $logoDataUrl,
                'legal_representative' => $company->legal_representative,
                'phone' => $company->phone,
                'email' => $company->email,
            ] : null,
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'email_verified_at' => $request->user()->email_verified_at,
                    'two_factor_confirmed_at' => $request->user()->two_factor_confirmed_at,
                    'created_at' => $request->user()->created_at,
                    'updated_at' => $request->user()->updated_at,
                    'permissions' => $request->user()->getAllPermissions()->pluck('name')->toArray(),
                    'roles' => $request->user()->getRoleNames()->toArray(),
                ] : null,
            ],
            'notifications' => fn () => $request->user() ? [
                'items' => $request->user()
                    ->notifications()
                    ->latest()
                    ->limit(20)
                    ->get()
                    ->map(fn ($notification) => [
                        'id' => (string) $notification->id,
                        'message' => $notification->data['message'] ?? 'Nueva notificación',
                        'href' => $notification->data['href'] ?? '/dashboard',
                        'source' => $notification->data['source'] ?? 'cash',
                        'type' => $notification->data['type'] ?? 'payment-updated',
                        'createdAt' => $notification->created_at?->toISOString(),
                        'readAt' => $notification->read_at?->toISOString(),
                        'read' => $notification->read_at !== null,
                        'serviceRequest' => [
                            'id' => $notification->data['service_request']['id'] ?? null,
                            'requestNumber' => $notification->data['service_request']['request_number'] ?? null,
                            'patientName' => $notification->data['service_request']['patient_name'] ?? null,
                        ],
                    ])
                    ->values()
                    ->all(),
                'unreadCount' => $request->user()->unreadNotifications()->count(),
            ] : [
                'items' => [],
                'unreadCount' => 0,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            
            // Flash messages
            'message' => fn () => $request->session()->get('message'),
            'error' => fn () => $request->session()->get('error'),
        ];
    }
}
