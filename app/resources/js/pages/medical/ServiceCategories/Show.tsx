import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type ServiceCategory } from '@/types/service-category';
import { 
    ArrowLeft, 
    Pencil, 
    FolderOpen, 
    FolderX, 
    Calendar,
    FileText,
    Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface ShowProps {
    category: ServiceCategory;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ServiceCategoryShow({ category, flash }: ShowProps) {
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
    ];

    // Show flash messages
    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Categoría: ${category.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/medical/service-categories">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Button>
                        </Link>
                        <HeadingSmall
                            title={category.name}
                            description="Detalles de la categoría de servicios médicos"
                        />
                    </div>
                    <Link href={`/medical/service-categories/${category.id}/edit`}>
                        <Button>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Information */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Información General
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground mb-1">
                                            Nombre de la Categoría
                                        </div>
                                        <div className="text-lg font-semibold">{category.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground mb-1">
                                            Estado
                                        </div>
                                        <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                                            {category.status === 'active' ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </div>
                                </div>

                                {category.description && (
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground mb-1">
                                            Descripción
                                        </div>
                                        <div className="text-sm bg-muted/30 p-3 rounded-md">
                                            {category.description}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Services Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Servicios Asociados
                                </CardTitle>
                                <CardDescription>
                                    Información sobre los servicios médicos en esta categoría
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    {category.active_services_count > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <FolderOpen className="h-8 w-8 text-blue-500" />
                                            <div>
                                                <div className="text-2xl font-bold">
                                                    {category.active_services_count}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    servicios activos
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <FolderX className="h-8 w-8 text-gray-400" />
                                            <div>
                                                <div className="text-lg font-semibold text-muted-foreground">
                                                    Sin servicios
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    No hay servicios asociados
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {category.active_services_count === 0 && (
                                    <Alert className="mt-4">
                                        <AlertDescription>
                                            Esta categoría no tiene servicios médicos asociados. 
                                            Puede asignar servicios desde el módulo de servicios médicos.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Estado de la Categoría</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className={`h-3 w-3 rounded-full ${
                                        category.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                                    }`} />
                                    <div>
                                        <div className="font-medium">
                                            {category.status === 'active' ? 'Activa' : 'Inactiva'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {category.status === 'active' 
                                                ? 'Disponible para nuevos servicios'
                                                : 'No disponible para nuevos servicios'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dates Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Fechas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-sm font-medium">Creada</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(category.created_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Última actualización</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(category.updated_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Acciones</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={`/medical/service-categories/${category.id}/edit`} className="w-full">
                                    <Button variant="outline" className="w-full justify-start">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar Categoría
                                    </Button>
                                </Link>
                                <Link href="/medical/service-categories" className="w-full">
                                    <Button variant="outline" className="w-full justify-start">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Volver a la Lista
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}