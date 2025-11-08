import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type ServiceCategoryPageProps, type ServiceCategory } from '@/types/service-category';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Eye, Pencil, Trash2, FolderOpen, FolderX } from 'lucide-react';
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
        title: 'Categorías de Servicios',
        href: '/medical/service-categories',
    },
];

export default function ServiceCategoriesIndex({ categories, stats, flash }: ServiceCategoryPageProps) {
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; category: ServiceCategory | null }>({
        open: false,
        category: null
    });

    // Show flash messages
    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    const handleEdit = (category: ServiceCategory) => {
        router.get(`/medical/service-categories/${category.id}/edit`);
    };

    const handleView = (category: ServiceCategory) => {
        router.get(`/medical/service-categories/${category.id}`);
    };

    const handleDelete = (category: ServiceCategory) => {
        setDeleteDialog({ open: true, category });
    };

    const confirmDelete = () => {
        if (!deleteDialog.category) return;

        router.delete(`/medical/service-categories/${deleteDialog.category.id}`, {
            onSuccess: () => {
                toast.success('Categoría eliminada correctamente');
                setDeleteDialog({ open: false, category: null });
            },
            onError: () => {
                toast.error('Error al eliminar la categoría');
            }
        });
    };

    const columns: ColumnDef<ServiceCategory>[] = [
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
            accessorKey: 'description',
            header: 'Descripción',
            cell: ({ row }) => (
                <div className="max-w-[300px] truncate text-muted-foreground">
                    {row.getValue('description') || 'Sin descripción'}
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
            accessorKey: 'active_services_count',
            header: 'Servicios',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.getValue('active_services_count') as number > 0 ? (
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                    ) : (
                        <FolderX className="h-4 w-4 text-gray-400" />
                    )}
                    <span>{row.getValue('active_services_count')}</span>
                </div>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Creada',
            cell: ({ row }) => {
                const date = new Date(row.getValue('created_at'));
                return (
                    <div className="text-sm text-muted-foreground">
                        {date.toLocaleDateString('es-ES')}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Acciones',
            cell: ({ row }) => {
                const category = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(category)}
                            title="Ver detalles"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            title="Editar"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categorías de Servicios" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <HeadingSmall
                        title="Categorías de Servicios"
                        description="Gestión de categorías para organizar servicios médicos"
                    />
                    <Link href="/medical/service-categories/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Categoría
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total
                            </CardTitle>
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">
                                categorías registradas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Activas
                            </CardTitle>
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                            <p className="text-xs text-muted-foreground">
                                categorías activas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Inactivas
                            </CardTitle>
                            <div className="h-2 w-2 rounded-full bg-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.inactive}</div>
                            <p className="text-xs text-muted-foreground">
                                categorías inactivas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Con Servicios
                            </CardTitle>
                            <FolderOpen className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.with_services}</div>
                            <p className="text-xs text-muted-foreground">
                                con servicios asociados
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Sin Servicios
                            </CardTitle>
                            <FolderX className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.without_services}</div>
                            <p className="text-xs text-muted-foreground">
                                sin servicios asociados
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Categorías</CardTitle>
                        <CardDescription>
                            Administra las categorías de servicios médicos
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={categories}
                            columns={columns}
                            searchPlaceholder="Buscar por nombre..."
                            searchKey="search"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la categoría "{deleteDialog.category?.name}". 
                            {deleteDialog.category?.active_services_count && deleteDialog.category.active_services_count > 0 
                                ? ` Esta categoría tiene ${deleteDialog.category.active_services_count} servicios asociados.`
                                : ''
                            }
                            <br />
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}