import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head, Link } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <>
            <Head title="Iniciar sesión" />
            <div className="min-h-svh bg-slate-100 p-4 md:p-6">
                <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
                    <section className="relative hidden h-full min-h-250 md:flex">
                        <img
                            src="/images/landing-logo.png"
                            alt="Panel informativo de Aranto"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 space-y-4 p-10 text-white">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-200">Aranto - Sistema Médico Integral</p>
                            <h2 className="max-w-md text-xl font-semibold leading-tight">
                                Gestión Médica Integral para Sanatorios
                            </h2>
                            <ul className="space-y-2 text-sm text-slate-100/90">
                                <li>Control de pacientes, profesionales y servicios.</li>
                                <li>Liquidaciones de comision con validacion operativa.</li>
                                <li>Cobros centralizados en caja con historial auditado.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="flex items-center justify-center p-6 sm:p-10 md:p-12">
                        <div className="w-full max-w-md space-y-8">
                            <Link href={home()} className="flex w-full justify-center">
                                <img src="/logo-brand.png" alt="Aranto" className="h-22 w-auto object-contain dark:hidden" />
                                <img src="/logo-brand-dark.png" alt="Aranto" className="hidden h-22 w-auto object-contain dark:block" />
                            </Link>

                            <div className="space-y-2 items-center text-center">
                                <h1 className="text-2xl font-semibold text-slate-900">Inicia sesion en tu cuenta</h1>
                                <p className="text-sm text-slate-600">
                                    Ingresa con tu email o nombre de usuario. Las cuentas nuevas se habilitan por invitacion via email.
                                </p>
                            </div>

                            {status && (
                                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                                    {status}
                                </div>
                            )}

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="flex flex-col gap-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-5">
                                            <div className="grid gap-2">
                                                <Label htmlFor="email">Email o nombre de usuario</Label>
                                                <Input
                                                    id="email"
                                                    type="text"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="username"
                                                    placeholder="correo@ejemplo.com o nombre"
                                                />
                                                <InputError message={errors.email} />
                                            </div>

                                            <div className="grid gap-2">
                                                <div className="flex items-center">
                                                    <Label htmlFor="password">Contraseña</Label>
                                                    {canResetPassword && (
                                                        <TextLink
                                                            href={request()}
                                                            className="ml-auto text-sm"
                                                            tabIndex={5}
                                                        >
                                                            ¿Olvidaste tu contraseña?
                                                        </TextLink>
                                                    )}
                                                </div>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="Contraseña"
                                                />
                                                <InputError message={errors.password} />
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="remember"
                                                    name="remember"
                                                    tabIndex={3}
                                                />
                                                <Label htmlFor="remember">Recuérdame</Label>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="mt-2 w-full"
                                                tabIndex={4}
                                                disabled={processing}
                                                data-test="login-button"
                                            >
                                                {processing && <Spinner />}
                                                Iniciar sesión
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>

                            <p className="text-xs text-slate-500">
                                Si necesitas acceso por primera vez, solicita invitación al administrador del sistema.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
