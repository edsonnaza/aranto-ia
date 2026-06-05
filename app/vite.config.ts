import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import path from 'path';
import { execSync } from 'child_process';

// Get the wayfinder command with fallback to docker
const getWayfinderCommand = () => {
    // Try local PHP first
    try {
        execSync('php artisan --version', { stdio: 'ignore', cwd: __dirname });
        return 'php artisan wayfinder:generate';
    } catch {
        // Fallback to docker
        try {
            execSync('docker compose exec -T app php artisan --version 2>/dev/null', { stdio: 'ignore' });
            return 'docker compose exec -T app php artisan wayfinder:generate';
        } catch {
            // If both fail, disable wayfinder
            console.warn('⚠️  Could not execute wayfinder - PHP not available. Disabling wayfinder plugin.');
            return null;
        }
    }
};

const wayfinderCommand = getWayfinderCommand();

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
        ...(wayfinderCommand ? [
            wayfinder({
                formVariants: true,
                command: wayfinderCommand,
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
