import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, DataTableColumnHeader, DataTableRowActions } from '@/components/ui/data-table';
import { useSampleTypes } from '@/hooks/useSampleTypes';
import { toast } from 'sonner';

interface SampleType {
  id: number;
  name: string;
  code: string;
  description: string;
  container_type: string;
  preservation_requirements: string;
  stability_hours: number;
  status: 'active' | 'inactive';
}

interface Props {
  sampleTypes: {
    data: SampleType[];
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

export default function SampleTypesIndex({ sampleTypes, filters }: Props) {
  const { destroy } = useSampleTypes();
  const [sampleTypeToDelete, setSampleTypeToDelete] = useState<SampleType | null>(null);

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/sample-types', title: 'Tipos de Muestra', current: true },
  ];

  const handleDelete = () => {
    if (!sampleTypeToDelete) return;

    destroy(sampleTypeToDelete.id, () => {
      toast.success('Tipo de muestra eliminado exitosamente');
      setSampleTypeToDelete(null);
    });
  };

  const columns: ColumnDef<SampleType>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('code') as string}</span>,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue('name') as string}</span>,
    },
    {
      accessorKey: 'container_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Contenedor" />,
    },
    {
      accessorKey: 'stability_hours',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estabilidad" />,
      cell: ({ row }) => {
        const hours = row.original.stability_hours;
        return <span>{hours ? `${hours}h` : 'N/A'}</span>;
      },
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
          <Link href={`/medical/laboratory/sample-types/${row.original.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
            <Button
            variant="ghost"
            size="sm"
            onClick={() => setSampleTypeToDelete(row.original)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </DataTableRowActions>
      ),
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Tipos de Muestra - Laboratorio" />

      <div className="p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Tipos de Muestra</h1>
            <p className="text-sm text-muted-foreground">Gestión de tipos de muestra de laboratorio</p>
          </div>
          <Link href="/medical/laboratory/sample-types/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-900/60 shadow-sm">
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-lg font-semibold">Tipos registrados</h3>
          </div>
          <div className="px-6 pb-6">
            <DataTable
              columns={columns}
              data={sampleTypes}
              searchable
              searchPlaceholder="Buscar por nombre o código..."
              emptyMessage="No se encontraron tipos de muestra."
              initialSearch={filters.search || ''}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={!!sampleTypeToDelete} onOpenChange={(open) => !open && setSampleTypeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de muestra?</AlertDialogTitle>
            <AlertDialogDescription>
              {sampleTypeToDelete
                ? `Se eliminará el tipo de muestra "${sampleTypeToDelete.name}". Esta acción no se puede deshacer.`
                : 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar tipo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
      
