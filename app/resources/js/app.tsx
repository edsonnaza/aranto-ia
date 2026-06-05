import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { configureEcho } from '@laravel/echo-react';
// DEBUG: Verifica que las variables estén bien
console.log('VITE_REVERB_HOST', import.meta.env.VITE_REVERB_HOST);
console.log('VITE_REVERB_PORT', import.meta.env.VITE_REVERB_PORT);
console.log('VITE_REVERB_APP_KEY', import.meta.env.VITE_REVERB_APP_KEY);
console.log('VITE_REVERB_SCHEME', import.meta.env.VITE_REVERB_SCHEME);


const _csrfMeta = typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]') : null;
const csrfToken = _csrfMeta ? (_csrfMeta as HTMLMetaElement).getAttribute('content') ?? '' : '';


configureEcho({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT),
        scheme: import.meta.env.VITE_REVERB_SCHEME,
        forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
        // ...existing config...
        authTransport: 'ajax',
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: { 'X-CSRF-TOKEN': csrfToken }
        },
        withCredentials: true,
});


const appName = 'Aranto';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
