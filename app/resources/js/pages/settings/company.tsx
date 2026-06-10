import { useEffect, useMemo, useState } from 'react';

import { Head, useForm, usePage } from '@inertiajs/react';
import { Building2, Camera, ImageOff, Save } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem, type CompanySetting, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configuración de empresa',
        href: '/settings/company',
    },
];

type CompanyFormData = {
    _method: 'patch';
    name: string;
    ruc: string;
    legal_representative: string;
    phone: string;
    email: string;
    logo: File | null;
};

function getInitialCompany(company: CompanySetting | null): CompanyFormData {
    return {
        _method: 'patch',
        name: company?.name ?? '',
        ruc: company?.ruc ?? '',
        legal_representative: company?.legal_representative ?? '',
        phone: company?.phone ?? '',
        email: company?.email ?? '',
        logo: null,
    };
}

export default function CompanySettings() {
    const { company } = usePage<SharedData>().props;
    const [logoPreview, setLogoPreview] = useState<string | null>(company?.logo_data_url ?? null);
    const [logoFileName, setLogoFileName] = useState<string | null>(null);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm<CompanyFormData>(getInitialCompany(company));

    useEffect(() => {
        setLogoPreview(company?.logo_data_url ?? null);
    }, [company?.logo_data_url]);

    const handleLogoChange = (file: File | null) => {
        setData('logo', file);
        setLogoFileName(file?.name ?? null);

        if (!file) {
            setLogoPreview(company?.logo_data_url ?? null);
            return;
        }

        setLogoPreview(URL.createObjectURL(file));
    };

    useEffect(() => {
        return () => {
            if (logoPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    const stats = useMemo(() => [
        {
            label: 'Nombre',
            value: company?.name ?? 'Sin configurar',
        },
        {
            label: 'RUC',
            value: company?.ruc ?? 'Sin configurar',
        },
        {
            label: 'Contacto',
            value: [company?.phone, company?.email].filter(Boolean).join(' · ') || 'Sin configurar',
        },
    ], [company]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        setData('_method', 'patch');

        post('/settings/company', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de empresa" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Configuración de empresa"
                        description="Define los datos que aparecerán en la cabecera de los documentos PDF y futuras exportaciones."
                    />

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(360px,1fr)]">
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Building2 className="h-4 w-4" />
                                    Datos de la empresa
                                </CardTitle>
                                <CardDescription>
                                    Mantén esta información actualizada para usarla en todos los documentos del sistema.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <Label htmlFor="name">Nombre de la empresa</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Sanatorio, clínica o razón social"
                                                className="mt-1"
                                                required
                                            />
                                            <InputError className="mt-1" message={errors.name} />
                                        </div>

                                        <div>
                                            <Label htmlFor="ruc">RUC</Label>
                                            <Input
                                                id="ruc"
                                                value={data.ruc}
                                                onChange={(e) => setData('ruc', e.target.value)}
                                                placeholder="80012345-0"
                                                className="mt-1"
                                            />
                                            <InputError className="mt-1" message={errors.ruc} />
                                        </div>

                                        <div>
                                            <Label htmlFor="phone">Teléfono</Label>
                                            <Input
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                placeholder="(021) 123-456"
                                                className="mt-1"
                                            />
                                            <InputError className="mt-1" message={errors.phone} />
                                        </div>

                                        <div>
                                            <Label htmlFor="legal_representative">Representante legal</Label>
                                            <Input
                                                id="legal_representative"
                                                value={data.legal_representative}
                                                onChange={(e) => setData('legal_representative', e.target.value)}
                                                placeholder="Nombre completo"
                                                className="mt-1"
                                            />
                                            <InputError className="mt-1" message={errors.legal_representative} />
                                        </div>

                                        <div>
                                            <Label htmlFor="email">Correo electrónico</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="contacto@empresa.com"
                                                className="mt-1"
                                            />
                                            <InputError className="mt-1" message={errors.email} />
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="logo">Logo de la empresa</Label>
                                        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 dark:bg-muted/10">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border bg-background">
                                                    {logoPreview ? (
                                                        <img
                                                            src={logoPreview}
                                                            alt="Vista previa del logo"
                                                            className="h-full w-full object-contain p-2"
                                                        />
                                                    ) : (
                                                        <ImageOff className="h-6 w-6 text-muted-foreground" />
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-foreground">
                                                        Sube un logo cuadrado o horizontal
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Se usará en la cabecera de PDFs y futuras exportaciones.
                                                    </p>
                                                </div>
                                            </div>

                                            <FileUploadField
                                                id="logo"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={handleLogoChange}
                                                fileName={logoFileName}
                                                hasExistingFile={Boolean(logoPreview)}
                                                placeholder="Subir logo de la empresa"
                                                hint="PNG, JPG o WEBP. Ideal para cabecera de PDF. Máximo 2 MB."
                                                note="Preferí un logo limpio, bien recortado y con buen contraste para impresión."
                                            />

                                            <InputError className="mt-1" message={errors.logo} />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-3">
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Guardando...' : 'Guardar configuración'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setData(getInitialCompany(company));
                                                setLogoPreview(company?.logo_data_url ?? null);
                                                setLogoFileName(null);
                                            }}
                                        >
                                            <Camera className="mr-2 h-4 w-4" />
                                            Restablecer
                                        </Button>
                                    </div>

                                    {recentlySuccessful ? (
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            Configuración guardada correctamente.
                                        </p>
                                    ) : null}
                                </form>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="border-border/60 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base">Vista previa del documento</CardTitle>
                                    <CardDescription>
                                        Así se reflejarán los datos en la cabecera de impresión.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-xl border bg-background p-4 shadow-sm dark:bg-background/95">
                                        <div className="mb-3 flex items-start gap-3">
                                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
                                                {logoPreview ? (
                                                    <img
                                                        src={logoPreview}
                                                        alt="Logo"
                                                        className="h-full w-full object-contain p-1"
                                                    />
                                                ) : (
                                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold uppercase">{data.name || 'Nombre de la empresa'}</p>
                                                <p className="text-xs text-muted-foreground">{data.ruc ? `RUC: ${data.ruc}` : 'RUC pendiente'}</p>
                                                <p className="text-xs text-muted-foreground">{data.legal_representative || 'Representante legal pendiente'}</p>
                                            </div>
                                        </div>
                                        <div className="border-t pt-3 text-xs text-muted-foreground">
                                            <p>{data.phone || 'Teléfono pendiente'}</p>
                                            <p>{data.email || 'Correo pendiente'}</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 text-sm">
                                        {stats.map((item) => (
                                            <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 dark:bg-muted/20">
                                                <span className="text-muted-foreground">{item.label}</span>
                                                <span className="font-medium text-right text-foreground">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/60 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base">Uso global</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm text-muted-foreground">
                                    <p>
                                        Estos datos se leen desde el estado compartido de Inertia, por lo que estarán disponibles para PDFs y documentos que adopten la cabecera global.
                                    </p>
                                    <p>
                                        El logo debe cargarse en formato PNG, JPG o WEBP y se almacenará en el disco público de Laravel.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
