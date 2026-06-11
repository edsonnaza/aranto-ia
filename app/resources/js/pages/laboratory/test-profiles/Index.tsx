import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DataTable,
    DataTableColumnHeader,
    DataTableRowActions,
} from '@/components/ui/data-table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLabTestProfiles } from '@/hooks/useLabTestProfiles';
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
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface LabArea {
    id: number;
    name: string;
    code: string;
}

interface Profile {
    id: number;
    name: string;
    code: string;
    status: 'active' | 'inactive';
    area?: LabArea | null;
    medical_service?: { name: string; code: string };
    parameters?: Array<{ id: number }>;
    profile_equipments?: Array<{ id: number }>;
}

interface Props {
    profiles: {
        data: Profile[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    areas: LabArea[];
    filters: {
        search?: string;
        status?: string;
        area_id?: string;
    };
    stats: {
        totalLabServices: number;
        configuredServices: number;
        pendingServices: number;
    };
}

export default function LabTestProfilesIndex({
    profiles,
    areas,
    filters,
    stats,
}: Props) {
    const { destroy } = useLabTestProfiles();
    const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
    const breadcrumbs = [
        { href: '/medical', title: 'Sistema Médico' },
        { href: '/medical/laboratory', title: 'Laboratorio' },
        {
            href: '/medical/laboratory/test-profiles',
            title: 'Perfiles de Laboratorio',
            current: true,
        },
    ];

    const handleDelete = () => {
        if (!profileToDelete) return;
        destroy(profileToDelete.id, () => {
            toast.success('Perfil eliminado exitosamente');
            setProfileToDelete(null);
        });
    };

    const columns: ColumnDef<Profile>[] = [
        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Código" />
            ),
            cell: ({ row }) => (
                <span className="font-mono text-sm">
                    {row.getValue('code') as string}
                </span>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Perfil" />
            ),
            cell: ({ row }) => (
                <span className="font-medium">
                    {row.getValue('name') as string}
                </span>
            ),
        },
        {
            id: 'area',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Area" />
            ),
            cell: ({ row }) =>
                row.original.area ? (
                    <Badge variant="outline">{row.original.area.name}</Badge>
                ) : (
                    <span className="text-muted-foreground">Sin area</span>
                ),
        },
        {
            id: 'service',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Servicio" />
            ),
            cell: ({ row }) => {
                const svc = row.original.medical_service;
                return (
                    <span className="text-muted-foreground">
                        {svc ? `${svc.code} - ${svc.name}` : '—'}
                    </span>
                );
            },
        },
        {
            id: 'parameters',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Parámetros" />
            ),
            cell: ({ row }) => (
                <span>{row.original.parameters?.length ?? 0}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Estado" />
            ),
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.status === 'active'
                            ? 'default'
                            : 'secondary'
                    }
                >
                    {row.original.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Acciones</span>,
            cell: ({ row }) => (
                <DataTableRowActions>
                    <Link
                        href={`/medical/laboratory/test-profiles/${row.original.id}/edit`}
                    >
                        <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProfileToDelete(row.original)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </DataTableRowActions>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Perfiles de Laboratorio" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FlaskConical className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Perfiles de Laboratorio
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Configure qué perfil se usa para cada servicio
                                de laboratorio.
                            </p>
                        </div>
                    </div>
                    <Link href="/medical/laboratory/test-profiles/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Perfil
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardContent className="grid grid-cols-1 gap-3 pt-6 md:grid-cols-3">
                        <div className="rounded border p-3">
                            <p className="text-sm text-muted-foreground">
                                Servicios LAB
                            </p>
                            <p className="text-xl font-semibold">
                                {stats.totalLabServices}
                            </p>
                        </div>
                        <div className="rounded border p-3">
                            <p className="text-sm text-muted-foreground">
                                Servicios con perfil
                            </p>
                            <p className="text-xl font-semibold">
                                {stats.configuredServices}
                            </p>
                        </div>
                        <div className="rounded border p-3">
                            <p className="text-sm text-muted-foreground">
                                Pendientes de configurar
                            </p>
                            <p className="text-xl font-semibold text-amber-600">
                                {stats.pendingServices}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950">
                    <div className="px-6 pt-6 pb-2">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <h3 className="text-lg font-semibold">
                                Perfiles registrados
                            </h3>
                            <div className="w-full md:w-64">
                                <Select
                                    value={filters.area_id || 'all'}
                                    onValueChange={(value) =>
                                        router.get(
                                            '/medical/laboratory/test-profiles',
                                            {
                                                ...filters,
                                                area_id:
                                                    value === 'all'
                                                        ? undefined
                                                        : value,
                                            },
                                            { preserveState: true },
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por area" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Todas las areas
                                        </SelectItem>
                                        {areas.map((area) => (
                                            <SelectItem
                                                key={area.id}
                                                value={String(area.id)}
                                            >
                                                {area.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 pb-6">
                        <DataTable
                            columns={columns}
                            data={profiles}
                            searchable
                            searchPlaceholder="Buscar por perfil, código o servicio..."
                            emptyMessage="No se encontraron perfiles."
                            initialSearch={filters.search || ''}
                        />
                    </div>
                </div>
            </div>

            <AlertDialog open={!!profileToDelete} onOpenChange={(open) => !open && setProfileToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar perfil?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {profileToDelete
                                ? `Se eliminará el perfil "${profileToDelete.name}". Esta acción no se puede deshacer.`
                                : 'Esta acción no se puede deshacer.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Eliminar perfil</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
