import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import path from 'path';
import { execSync } from 'child_process';

// Check if PHP is available
const isPhpAvailable = () => {
    try {
        execSync('which php', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
};

const phpAvailable = isPhpAvailable();

export default defineConfig({
    server: {
        host: 'localhost',
        port: 5173,
        watch: {
            usePolling: true,
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            // Only enable react-compiler in production to avoid noisy warnings during dev
            babel: {
                plugins: process.env.NODE_ENV === 'production' ? ['babel-plugin-react-compiler'] : [],
            },
        }),
        tailwindcss(),
        ...(phpAvailable ? [
            wayfinder({
                formVariants: true,
                command: process.env.WAYFINDER_COMMAND || 'php artisan wayfinder:generate',
            }),
        ] : []),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
      alias: {
                '@/components': path.resolve(__dirname, 'resources/js/components'),
                '@/pages': path.resolve(__dirname, 'resources/js/pages'),
                '@/types': path.resolve(__dirname, 'resources/js/types'),
        '@': path.resolve(__dirname, 'resources/js'),
      },
    },
});
