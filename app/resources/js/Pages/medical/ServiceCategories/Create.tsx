import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Sistema Médico',
        href: '/medical',
    },
    {
        title: 'Categorías de Servicios',
        href: '/medical/service-categories',
    },
    {
        title: 'Nueva Categoría',
        href: '/medical/service-categories/create',
    },
];

export default function ServiceCategoryCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        status: 'active' as 'active' | 'inactive',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post('/medical/service-categories');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nueva Categoría de Servicios" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/medical/service-categories">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </Link>
                    <HeadingSmall
                        title="Nueva Categoría de Servicios"
                        description="Crear una nueva categoría para organizar servicios médicos"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información de la Categoría</CardTitle>
                                <CardDescription>
                                    Complete los datos para crear una nueva categoría de servicios
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {/* Name */}
                                        <div className="md:col-span-2">
                                            <Label htmlFor="name">
                                                Nombre de la Categoría *
                                            </Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Ej: Consultas Médicas, Procedimientos..."
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={errors.name} className="mt-1" />
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <Label htmlFor="status">Estado</Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(value) => setData('status', value as 'active' | 'inactive')}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Seleccionar estado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Activa</SelectItem>
                                                    <SelectItem value="inactive">Inactiva</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.status} className="mt-1" />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <Label htmlFor="description">
                                            Descripción
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Descripción de la categoría (opcional)"
                                            className="mt-1"
                                            rows={4}
                                        />
                                        <InputError message={errors.description} className="mt-1" />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-4">
                                        <Link href="/medical/service-categories">
                                            <Button type="button" variant="outline">
                                                Cancelar
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Guardando...' : 'Crear Categoría'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar with Help */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Información</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <AlertDescription>
                                        Las categorías ayudan a organizar los servicios médicos para facilitar su gestión y búsqueda.
                                    </AlertDescription>
                                </Alert>
                                
                                <div className="space-y-2 text-sm">
                                    <h4 className="font-medium">Consejos:</h4>
                                    <ul className="space-y-1 text-muted-foreground">
                                        <li>• Use nombres descriptivos y claros</li>
                                        <li>• Evite duplicar categorías existentes</li>
                                        <li>• La descripción ayuda a otros usuarios</li>
                                        <li>• Puede cambiar el estado posteriormente</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Estados Disponibles</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <div>
                                        <div className="font-medium">Activa</div>
                                        <div className="text-sm text-muted-foreground">
                                            Disponible para asignar servicios
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                                    <div>
                                        <div className="font-medium">Inactiva</div>
                                        <div className="text-sm text-muted-foreground">
                                            No disponible para nuevos servicios
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}