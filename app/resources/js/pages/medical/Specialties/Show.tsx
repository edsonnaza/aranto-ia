import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Specialty } from '@/hooks/medical/useSpecialties';
import { 
    ArrowLeft, 
    Pencil, 
    Users, 
    Code,
    Calendar,
    FileText,
    Activity,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ShowProps {
    specialty: Specialty;
    professionals?: Array<{
        id: number;
        name: string;
        last_name: string;
        document_number: string;
        specialty_type?: string;
    }>;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function SpecialtyShow({ specialty, professionals = [], flash }: ShowProps) {
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
            title: 'Especialidades',
            href: '/medical/specialties',
        },
        {
            title: specialty.name,
            href: `/medical/specialties/${specialty.id}`,
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
            <Head title={`Especialidad: ${specialty.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/medical/specialties">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Button>
                        </Link>
                        <HeadingSmall
                            title={specialty.name}
                            description="Detalles de la especialidad médica"
                        />
                    </div>
                    <Link href={`/medical/specialties/${specialty.id}/edit`}>
                        <Button>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Información General</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Nombre</p>
                                        <p className="text-lg font-semibold">{specialty.name}</p>
                                    </div>
                                    {specialty.code && (
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                                <Code className="w-4 h-4" /> Código
                                            </p>
                                            <Badge variant="outline" className="text-base font-mono">
                                                {specialty.code}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                        <Activity className="w-4 h-4" /> Estado
                                    </p>
                                    <Badge variant={specialty.status === 'active' ? 'default' : 'secondary'}>
                                        {specialty.status === 'active' ? 'Activa' : 'Inactiva'}
                                    </Badge>
                                </div>

                                {specialty.description && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                            <FileText className="w-4 h-4" /> Descripción
                                        </p>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                                            {specialty.description}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Statistics */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Profesionales Activos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{specialty.active_professionals_count}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Profesionales con esta especialidad
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Especialistas Principales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{specialty.primary_professionals_count}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Con esta como especialidad principal
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Professionals List */}
                        {professionals.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Profesionales con esta Especialidad
                                    </CardTitle>
                                    <CardDescription>
                                        {professionals.length} profesionales registrados
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {professionals.map((professional) => (
                                            <div
                                                key={professional.id}
                                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">
                                                        {professional.name} {professional.last_name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {professional.document_number}
                                                    </p>
                                                </div>
                                                <Link href={`/medical/professionals/${professional.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        Ver Perfil
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    No hay profesionales registrados con esta especialidad
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Metadata */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Metadatos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                                        <Code className="w-4 h-4" /> ID
                                    </p>
                                    <p className="font-mono text-xs bg-gray-50 p-2 rounded">
                                        {specialty.id}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Creado
                                    </p>
                                    <p className="text-xs">
                                        {new Date(specialty.created_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Actualizado
                                    </p>
                                    <p className="text-xs">
                                        {new Date(specialty.updated_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Info */}
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-semibold mb-1">Información</p>
                                <p className="text-xs">
                                    Esta especialidad está actualmente <strong>{specialty.status === 'active' ? 'activa' : 'inactiva'}</strong> en el sistema.
                                </p>
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
