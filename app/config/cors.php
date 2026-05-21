<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration enables Cross-Origin requests for development so the
    | Vite dev server (usually http://localhost:5173) can make authenticated
    | requests (with credentials) to the Laravel backend on a different port.
    |
    */

    'paths' => ['api/*', 'broadcasting/auth', 'sanctum/csrf-cookie', '*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('VITE_DEV_ORIGIN', 'http://localhost:5173'),
        env('APP_URL', 'http://localhost:8000'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Allow cookies / credentials for cross-origin requests during development
    'supports_credentials' => true,
];
