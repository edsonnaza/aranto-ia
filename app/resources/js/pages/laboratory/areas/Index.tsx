import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import AppLayout from '@/layouts/app-layout';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { useLabAreas } from '@/hooks/useLabAreas';

interface Area {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    status: 'active' | 'inactive';
    display_order: number;
    profiles_count: number;
    equipments_count: number;
}

interface Props {
    areas: {
        data: Area[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function LabAreasIndex({ areas, filters }: Props) {
    const { destroy } = useLabAreas();
    const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        { href: '/medical/laboratory/areas', title: 'Áreas', current: true },
    ];

    const handleDelete = () => {
        if (!areaToDelete) {
            return;
        }

        destroy(areaToDelete.id, () => {
            toast.success('Área eliminada exitosamente');
            setAreaToDelete(null);
        });
    };

    const columns: ColumnDef<Area>[] = [
        {
            accessorKey: 'code',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
            cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Área" />,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        },
        {
            accessorKey: 'display_order',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Orden" />,
        },
        {
            accessorKey: 'profiles_count',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Perfiles" />,
        },
        {
            accessorKey: 'equipments_count',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Equipos" />,
        },
        {
            accessorKey: 'status',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
                    {row.original.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Acciones</span>,
            cell: ({ row }) => (
                <DataTableRowActions>
                    <Link href={`/medical/laboratory/areas/${row.original.id}/edit`}>
                        <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setAreaToDelete(row.original)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </DataTableRowActions>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Áreas - Laboratorio" />

            <div className="p-4 md:p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Áreas de Laboratorio</h1>
                        <p className="text-sm text-muted-foreground">Organización base de perfiles y equipos.</p>
                    </div>
                    <Link href="/medical/laboratory/areas/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Área
                        </Button>
                    </Link>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950">
                    <div className="px-6 pt-6 pb-2">
                        <h3 className="text-lg font-semibold">Áreas registradas</h3>
                    </div>
                    <div className="px-6 pb-6">
                        <DataTable
                            columns={columns}
                            data={areas}
                            searchable
                            searchPlaceholder="Buscar por nombre o código..."
                            emptyMessage="No se encontraron áreas."
                            initialSearch={filters.search || ''}
                            statusFilterable
                            statusOptions={[
                                { value: 'active', label: 'Activo' },
                                { value: 'inactive', label: 'Inactivo' },
                            ]}
                            initialStatus={filters.status || ''}
                        />
                    </div>
                </div>
            </div>

            <AlertDialog open={!!areaToDelete} onOpenChange={(open) => !open && setAreaToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar área?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {areaToDelete
                                ? `Se eliminará el área "${areaToDelete.name}". Esta acción no se puede deshacer.`
                                : 'Esta acción no se puede deshacer.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Eliminar área</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
