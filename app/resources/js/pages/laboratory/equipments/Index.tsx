import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { useLabEquipments } from '@/hooks/useLabEquipments';

interface Area {
    id: number;
    name: string;
    code: string;
}

interface Equipment {
    id: number;
    name: string;
    code?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    serial_number?: string | null;
    department?: string | null;
    status: 'active' | 'maintenance' | 'inactive';
    area?: Area | null;
}

interface Props {
    equipments: {
        data: Equipment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    areas: Area[];
    filters: {
        search?: string;
        status?: string;
        area_id?: string;
    };
}

export default function LabEquipmentsIndex({ equipments, areas, filters }: Props) {
    const { destroy } = useLabEquipments();

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        { href: '/medical/laboratory/equipments', title: 'Equipos', current: true },
    ];

    const handleDelete = (equipment: Equipment) => {
        if (!confirm(`¿Eliminar equipo "${equipment.name}"?`)) {
            return;
        }

        destroy(equipment.id, () => toast.success('Equipo eliminado exitosamente'));
    };

    const columns: ColumnDef<Equipment>[] = [
        {
            accessorKey: 'code',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Codigo" />,
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.original.code || 'Sin codigo'}</span>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Equipo" />,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        },
        {
            accessorKey: 'area',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Area" />,
            cell: ({ row }) =>
                row.original.area ? (
                    <span>{row.original.area.code} - {row.original.area.name}</span>
                ) : (
                    <span className="text-muted-foreground">Compartido</span>
                ),
        },
        {
            accessorKey: 'manufacturer',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fabricante" />,
            cell: ({ row }) => row.original.manufacturer || 'N/A',
        },
        {
            accessorKey: 'status',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const labels = {
                    active: 'Activo',
                    maintenance: 'Mantenimiento',
                    inactive: 'Inactivo',
                } as const;

                const variants = {
                    active: 'default',
                    maintenance: 'secondary',
                    inactive: 'outline',
                } as const;

                return <Badge variant={variants[row.original.status]}>{labels[row.original.status]}</Badge>;
            },
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Acciones</span>,
            cell: ({ row }) => (
                <DataTableRowActions>
                    <Link href={`/medical/laboratory/equipments/${row.original.id}/edit`}>
                        <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </DataTableRowActions>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Equipos - Laboratorio" />

            <div className="p-4 md:p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Equipos de Laboratorio</h1>
                        <p className="text-sm text-muted-foreground">
                            Alta, edicion y organizacion de equipos por area.
                        </p>
                    </div>
                    <Link href="/medical/laboratory/equipments/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Equipo
                        </Button>
                    </Link>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950">
                    <div className="px-6 pt-6 pb-2">
                        <h3 className="text-lg font-semibold">Equipos registrados</h3>
                    </div>
                    <div className="px-6 pb-6">
                        <DataTable
                            columns={columns}
                            data={equipments}
                            searchable
                            searchPlaceholder="Buscar por codigo, nombre, fabricante o serie..."
                            emptyMessage="No se encontraron equipos."
                            initialSearch={filters.search || ''}
                            statusFilterable
                            statusOptions={[
                                { value: 'active', label: 'Activo' },
                                { value: 'maintenance', label: 'Mantenimiento' },
                                { value: 'inactive', label: 'Inactivo' },
                            ]}
                            initialStatus={filters.status || ''}
                            categoryFilterable
                            categoryOptions={areas.map((area) => ({
                                id: area.id,
                                name: `${area.code} - ${area.name}`,
                            }))}
                            initialCategory={filters.area_id || ''}
                            onStatusChange={(value) => {
                                router.get(
                                    '/medical/laboratory/equipments',
                                    {
                                        ...filters,
                                        status: value === 'all' ? undefined : value,
                                        page: 1,
                                    },
                                    { preserveState: true, replace: true },
                                );
                            }}
                            onCategoryChange={(value) => {
                                router.get(
                                    '/medical/laboratory/equipments',
                                    {
                                        ...filters,
                                        area_id: value === 'all' ? undefined : value,
                                        page: 1,
                                    },
                                    { preserveState: true, replace: true },
                                );
                            }}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
