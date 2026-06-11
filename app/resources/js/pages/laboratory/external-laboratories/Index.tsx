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
import { useLabExternalLaboratories } from '@/hooks/useLabExternalLaboratories';

interface ExternalLaboratory {
    id: number;
    name: string;
    contact_name?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    status: 'active' | 'inactive';
    test_requests_count: number;
}

interface Props {
    externalLaboratories: {
        data: ExternalLaboratory[];
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

export default function ExternalLaboratoriesIndex({ externalLaboratories, filters }: Props) {
    const { destroy } = useLabExternalLaboratories();
    const [labToDelete, setLabToDelete] = useState<ExternalLaboratory | null>(null);

    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        {
            href: '/medical/laboratory/external-laboratories',
            title: 'Laboratorios Externos',
            current: true,
        },
    ];

    const handleDelete = () => {
        if (!labToDelete) {
            return;
        }

        destroy(labToDelete.id, () => {
            toast.success('Laboratorio externo eliminado exitosamente');
            setLabToDelete(null);
        });
    };

    const columns: ColumnDef<ExternalLaboratory>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Laboratorio" />,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        },
        {
            accessorKey: 'contact_name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Contacto" />,
            cell: ({ row }) => row.original.contact_name || '-',
        },
        {
            accessorKey: 'phone',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Teléfono" />,
            cell: ({ row }) => row.original.phone || row.original.whatsapp || '-',
        },
        {
            accessorKey: 'email',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
            cell: ({ row }) => row.original.email || '-',
        },
        {
            accessorKey: 'test_requests_count',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estudios" />,
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
                    <Link href={`/medical/laboratory/external-laboratories/${row.original.id}/edit`}>
                        <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setLabToDelete(row.original)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </DataTableRowActions>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laboratorios Externos - Laboratorio" />

            <div className="p-4 md:p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Laboratorios Externos</h1>
                        <p className="text-sm text-muted-foreground">
                            Catálogo para estudios derivados y seguimiento externo.
                        </p>
                    </div>
                    <Link href="/medical/laboratory/external-laboratories/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Laboratorio
                        </Button>
                    </Link>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950">
                    <div className="px-6 pt-6 pb-2">
                        <h3 className="text-lg font-semibold">Laboratorios registrados</h3>
                    </div>
                    <div className="px-6 pb-6">
                        <DataTable
                            columns={columns}
                            data={externalLaboratories}
                            searchable
                            searchPlaceholder="Buscar por nombre, contacto o teléfono..."
                            emptyMessage="No se encontraron laboratorios externos."
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

            <AlertDialog open={!!labToDelete} onOpenChange={(open) => !open && setLabToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar laboratorio externo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {labToDelete
                                ? `Se eliminará "${labToDelete.name}". Esta acción no se puede deshacer.`
                                : 'Esta acción no se puede deshacer.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Eliminar laboratorio
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
