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
import { type ServiceCategory } from '@/types/service-category';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

interface EditProps {
    category: ServiceCategory;
}

export default function ServiceCategoryEdit({ category }: EditProps) {
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
            title: category.name,
            href: `/medical/service-categories/${category.id}`,
        },
        {
            title: 'Editar',
            href: `/medical/service-categories/${category.id}/edit`,
        },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name: category.name || '',
        description: category.description || '',
        status: category.status as 'active' | 'inactive',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        patch(`/medical/service-categories/${category.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar ${category.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={`/medical/service-categories/${category.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </Link>
                    <HeadingSmall
                        title={`Editar ${category.name}`}
                        description="Modificar información de la categoría de servicios"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información de la Categoría</CardTitle>
                                <CardDescription>
                                    Modifique los datos de la categoría de servicios
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
                                        <Link href={`/medical/service-categories/${category.id}`}>
                                            <Button type="button" variant="outline">
                                                Cancelar
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Guardando...' : 'Actualizar Categoría'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar with Info */}
                    <div className="space-y-6">
                        {/* Category Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Información Actual</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-sm font-medium">Servicios Asociados</div>
                                    <div className="text-sm text-muted-foreground">
                                        {category.active_services_count} servicios activos
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Creada</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(category.created_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Última actualización</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(category.updated_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Warning if has services */}
                        {category.active_services_count > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        Atención
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Alert>
                                        <AlertDescription>
                                            Esta categoría tiene {category.active_services_count} servicios asociados. 
                                            Los cambios podrían afectar la organización de estos servicios.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        )}

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