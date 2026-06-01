import { Head, Link, router } from '@inertiajs/react';
import { AppLayout } from '@/resources/js/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/resources/js/components/ui/card';
import { Button } from '@/resources/js/components/ui/button';
import { Badge } from '@/resources/js/components/ui/badge';
import { Input } from '@/resources/js/components/ui/input';
import { Beaker, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSampleTypes } from '@/resources/js/hooks/useSampleTypes';
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
  };
  filters: {
    search?: string;
    status?: string;
  };
}

export default function SampleTypesIndex({ sampleTypes, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const { destroy } = useSampleTypes();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/medical/laboratory/sample-types', { search }, { preserveState: true });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`¿Eliminar tipo de muestra "${name}"?`)) {
      destroy(id, () => {
        toast.success('Tipo de muestra eliminado exitosamente');
      });
    }
  };

  return (
    <AppLayout>
      <Head title="Tipos de Muestra - Laboratorio" />

      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Beaker className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tipos de Muestra</h1>
              <p className="text-sm text-muted-foreground">Gestión de tipos de muestra de laboratorio</p>
            </div>
          </div>
          <Link href="/medical/laboratory/sample-types/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Buscar</Button>
              </form>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">Código</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Contenedor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Estabilidad</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sampleTypes.data.map((type) => (
                    <tr key={type.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-mono">{type.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{type.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{type.container_type}</td>
                      <td className="px-4 py-3 text-sm">{type.stability_hours ? `${type.stability_hours}h` : 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={type.status === 'active' ? 'default' : 'secondary'}>
                          {type.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/medical/laboratory/sample-types/${type.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(type.id, type.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sampleTypes.data.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No se encontraron tipos de muestra</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
