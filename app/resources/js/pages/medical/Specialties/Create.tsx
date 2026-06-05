import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Specialty } from '@/hooks/medical/useSpecialties';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

interface CreatePageProps {
    statusOptions: Array<{ value: string; label: string }>;
}

interface EditPageProps {
    specialty: Specialty;
    statusOptions: Array<{ value: string; label: string }>;
}

const createBreadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Sistema Médico',
        href: '/medical',
    },
    {
        title: 'Especialidades',
        href: '/medical/specialties',
    },
    {
        title: 'Nueva Especialidad',
        href: '/medical/specialties/create',
    },
];

const editBreadcrumbs = (specialty: Specialty): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Sistema Médico',
        href: '/medical',
    },
    {
        title: 'Especialidades',
        href: '/medical/specialties',
    },
    {
        title: specialty.name,
        href: `/medical/specialties/${specialty.id}`,
    },
    {
        title: 'Editar',
        href: `/medical/specialties/${specialty.id}/edit`,
    },
];

export function Create({ statusOptions }: CreatePageProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        description: '',
        status: 'active' as 'active' | 'inactive',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/medical/specialties', {
            onSuccess: () => {
                // Success message will be shown by the controller's flash message
                // Page will redirect to index automatically
            }
        });
    };

    return (
        <AppLayout breadcrumbs={createBreadcrumbs}>
            <Head title="Nueva Especialidad" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/medical/specialties">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </Link>
                    <HeadingSmall
                        title="Nueva Especialidad"
                        description="Crear una nueva especialidad médica en el sistema"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información de la Especialidad</CardTitle>
                                <CardDescription>
                                    Complete los datos para crear una nueva especialidad
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <Label htmlFor="name">
                                            Nombre de la Especialidad *
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Ej: Cardiología, Pediatría, Oftalmología..."
                                            className="mt-1"
                                            required
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>

                                    {/* Code */}
                                    <div>
                                        <Label htmlFor="code">
                                            Código (Opcional)
                                        </Label>
                                        <Input
                                            id="code"
                                            type="text"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                            placeholder="Ej: CARD, PED, OFT..."
                                            maxLength={20}
                                            className="mt-1"
                                        />
                                        <InputError message={errors.code} className="mt-1" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Código único para identificar la especialidad
                                        </p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <Label htmlFor="description">
                                            Descripción (Opcional)
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe la especialidad y sus características..."
                                            className="mt-1 resize-none"
                                            rows={4}
                                        />
                                        <InputError message={errors.description} className="mt-1" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Máximo 500 caracteres
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <Label htmlFor="status">Estado *</Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(value) => setData('status', value as 'active' | 'inactive')}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.status} className="mt-1" />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                        <Link href="/medical/specialties">
                                            <Button type="button" variant="outline" disabled={processing}>
                                                Cancelar
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing} className="gap-2">
                                            <Save className="w-4 h-4" />
                                            {processing ? 'Guardando...' : 'Guardar Especialidad'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info Sidebar */}
                    <div className="md:col-span-1">
                        <Card className="bg-blue-50 border-blue-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-900">
                                    <AlertCircle className="w-5 h-5" />
                                    Información
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-blue-800">
                                <div>
                                    <p className="font-semibold mb-1">Campos Requeridos</p>
                                    <p>* Nombre y Estado</p>
                                </div>
                                <div>
                                    <p className="font-semibold mb-1">Código Único</p>
                                    <p>El código debe ser único en el sistema y sirve para identificar rápidamente la especialidad.</p>
                                </div>
                                <div>
                                    <p className="font-semibold mb-1">Descripción</p>
                                    <p>Añade una descripción para que los profesionales puedan entender mejor qué abarca esta especialidad.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export function Edit({ specialty, statusOptions }: EditPageProps) {
    const { data, setData, patch, processing, errors } = useForm({
        name: specialty.name,
        code: specialty.code || '',
        description: specialty.description || '',
        status: specialty.status as 'active' | 'inactive',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/medical/specialties/${specialty.id}`, {
            onSuccess: () => {
                // Success message will be shown by the controller's flash message
                // Page will redirect to index automatically
            }
        });
    };

    return (
        <AppLayout breadcrumbs={editBreadcrumbs(specialty)}>
            <Head title={`Editar: ${specialty.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/medical/specialties">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </Link>
                    <HeadingSmall
                        title={`Editar: ${specialty.name}`}
                        description="Actualiza los datos de la especialidad"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información de la Especialidad</CardTitle>
                                <CardDescription>
                                    Modifica los datos de la especialidad
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <Label htmlFor="name">
                                            Nombre de la Especialidad *
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Ej: Cardiología, Pediatría, Oftalmología..."
                                            className="mt-1"
                                            required
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>

                                    {/* Code */}
                                    <div>
                                        <Label htmlFor="code">
                                            Código (Opcional)
                                        </Label>
                                        <Input
                                            id="code"
                                            type="text"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                            placeholder="Ej: CARD, PED, OFT..."
                                            maxLength={20}
                                            className="mt-1"
                                        />
                                        <InputError message={errors.code} className="mt-1" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Código único para identificar la especialidad
                                        </p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <Label htmlFor="description">
                                            Descripción (Opcional)
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe la especialidad y sus características..."
                                            className="mt-1 resize-none"
                                            rows={4}
                                        />
                                        <InputError message={errors.description} className="mt-1" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Máximo 500 caracteres
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <Label htmlFor="status">Estado *</Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(value) => setData('status', value as 'active' | 'inactive')}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.status} className="mt-1" />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                        <Link href="/medical/specialties">
                                            <Button type="button" variant="outline" disabled={processing}>
                                                Cancelar
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing} className="gap-2">
                                            <Save className="w-4 h-4" />
                                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info Sidebar */}
                    <div className="md:col-span-1 space-y-4">
                        <Card className="bg-blue-50 border-blue-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-900">
                                    <AlertCircle className="w-5 h-5" />
                                    Información
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-blue-800">
                                <div>
                                    <p className="font-semibold mb-1">Campos Requeridos</p>
                                    <p>* Nombre y Estado</p>
                                </div>
                                <div>
                                    <p className="font-semibold mb-1">Código Único</p>
                                    <p>El código debe ser único en el sistema y sirve para identificar rápidamente la especialidad.</p>
                                </div>
                                <div>
                                    <p className="font-semibold mb-1">Descripción</p>
                                    <p>Añade una descripción para que los profesionales puedan entender mejor qué abarca esta especialidad.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-muted-foreground">ID:</span>
                                    <span className="font-mono text-xs">{specialty.id}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-muted-foreground">Creado:</span>
                                    <span className="text-xs">{new Date(specialty.created_at).toLocaleDateString('es-ES')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <span className="text-muted-foreground">Actualizado:</span>
                                    <span className="text-xs">{new Date(specialty.updated_at).toLocaleDateString('es-ES')}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
