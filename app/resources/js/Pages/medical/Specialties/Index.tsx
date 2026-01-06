import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Specialty, type SpecialtiesListData } from '@/hooks/medical/useSpecialties';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Eye, Pencil, Trash2, Code } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

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
];

export default function SpecialtiesIndex({ specialties, stats, filters, flash }: SpecialtiesListData & { flash?: { success?: string; error?: string } }) {
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; specialty: Specialty | null }>({
        open: false,
        specialty: null
    });

    // Show flash messages
    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    const handleEdit = (specialty: Specialty) => {
        router.get(`/medical/specialties/${specialty.id}/edit`);
    };

    const handleView = (specialty: Specialty) => {
        router.get(`/medical/specialties/${specialty.id}`);
    };

    const handleDelete = (specialty: Specialty) => {
        setDeleteDialog({ open: true, specialty });
    };

    const confirmDelete = () => {
        if (!deleteDialog.specialty) return;

        router.delete(`/medical/specialties/${deleteDialog.specialty.id}`, {
            onSuccess: () => {
                toast.success('Especialidad eliminada correctamente');
                setDeleteDialog({ open: false, specialty: null });
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(', ');
                toast.error(errorMessage || 'Error al eliminar la especialidad');
            }
        });
    };

    const columns: ColumnDef<Specialty>[] = [
        {
            accessorKey: 'name',
            header: 'Nombre',
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.getValue('name')}
                </div>
            ),
        },
        {
            accessorKey: 'code',
            header: 'Código',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Code className="w-4 h-4" />
                    {row.getValue('code') || 'Sin código'}
                </div>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Descripción',
            cell: ({ row }) => (
                <div className="max-w-[300px] truncate text-muted-foreground">
                    {row.getValue('description') || 'Sin descripción'}
                </div>
            ),
        },
        {
            accessorKey: 'active_professionals_count',
            header: 'Profesionales Activos',
            cell: ({ row }) => (
                <div className="text-center">
                    <Badge variant="outline">
                        {row.getValue('active_professionals_count')} activos
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return (
                    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status === 'active' ? 'Activa' : 'Inactiva'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => {
                const specialty = row.original;
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(specialty)}
                            title="Ver detalles"
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(specialty)}
                            title="Editar"
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(specialty)}
                            title="Eliminar"
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Especialidades" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <HeadingSmall
                        title="Especialidades Médicas"
                        description="Gestiona las especialidades del sistema"
                    />
                    <Link href="/medical/specialties/create">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nueva Especialidad
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total de Especialidades
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.active} activas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Especialidades Activas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {((stats.active / stats.total) * 100).toFixed(1)}% del total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Profesionales Registrados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_professionals}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                En especialidades activas
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Listado de Especialidades</CardTitle>
                        <CardDescription>
                            {specialties.total} especialidades encontradas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={specialties}
                            searchable={true}
                            searchPlaceholder="Buscar por nombre, código o descripción..."
                            searchKey="search"
                            statusFilterable={true}
                            statusOptions={[
                                { value: 'active', label: 'Activas' },
                                { value: 'inactive', label: 'Inactivas' }
                            ]}
                            onSearch={(search) => {
                                router.get('/medical/specialties', { search, status: filters?.status }, {
                                    preserveScroll: true,
                                    replace: true
                                });
                            }}
                            onStatusChange={(status) => {
                                router.get('/medical/specialties', { search: filters?.search, status }, {
                                    preserveScroll: true,
                                    replace: true
                                });
                            }}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
                if (!open) {
                    setDeleteDialog({ open: false, specialty: null });
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Especialidad</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Está seguro de que desea eliminar la especialidad "{deleteDialog.specialty?.name}"?
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
