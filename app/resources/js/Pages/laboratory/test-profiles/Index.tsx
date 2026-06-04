import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { useLabTestProfiles } from '@/hooks/useLabTestProfiles';

interface Profile {
  id: number;
  name: string;
  code: string;
  status: 'active' | 'inactive';
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
  filters: {
    search?: string;
    status?: string;
  };
  stats: {
    totalLabServices: number;
    configuredServices: number;
    pendingServices: number;
  };
}

export default function LabTestProfilesIndex({ profiles, filters, stats }: Props) {
  const { destroy } = useLabTestProfiles();
  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/test-profiles', title: 'Perfiles de Laboratorio', current: true },
  ];

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`¿Eliminar perfil "${name}"?`)) return;
    destroy(id, () => toast.success('Perfil eliminado exitosamente'));
  };

  const columns: ColumnDef<Profile>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('code') as string}</span>,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Perfil" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue('name') as string}</span>,
    },
    {
      id: 'service',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Servicio" />,
      cell: ({ row }) => {
        const svc = row.original.medical_service;
        return <span className="text-muted-foreground">{svc ? `${svc.code} - ${svc.name}` : '—'}</span>;
      },
    },
    {
      id: 'parameters',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Parámetros" />,
      cell: ({ row }) => <span>{row.original.parameters?.length ?? 0}</span>,
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
          <Link href={`/medical/laboratory/test-profiles/${row.original.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id, row.original.name)}
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

      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Perfiles de Laboratorio</h1>
              <p className="text-sm text-muted-foreground">
                Configure qué perfil se usa para cada servicio de laboratorio.
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
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded border p-3">
              <p className="text-sm text-muted-foreground">Servicios LAB</p>
              <p className="text-xl font-semibold">{stats.totalLabServices}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-sm text-muted-foreground">Servicios con perfil</p>
              <p className="text-xl font-semibold">{stats.configuredServices}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-sm text-muted-foreground">Pendientes de configurar</p>
              <p className="text-xl font-semibold text-amber-600">{stats.pendingServices}</p>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-900/60 shadow-sm">
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-lg font-semibold">Perfiles registrados</h3>
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
    </AppLayout>
  );
}
