import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { configureEcho } from '@laravel/echo-react';

const _csrfMeta = typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]') : null;
const _csrf = _csrfMeta ? (_csrfMeta as HTMLMetaElement).getAttribute('content') : undefined;

configureEcho({
    broadcaster: 'reverb',
    authTransport: 'ajax',
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': _csrf,
        },
    },
    // ensure XHR sends cookies when performing the /broadcasting/auth request
    // some runtimes accept this flag; keep it for interoperability
    // @ts-ignore
    withCredentials: true,
});

const appName = 'Aranto';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
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
