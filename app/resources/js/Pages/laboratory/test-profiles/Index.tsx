import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
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
  const [search, setSearch] = useState(filters.search || '');
  const { search: runSearch, destroy } = useLabTestProfiles();
  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/test-profiles', title: 'Perfiles de Laboratorio', current: true },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch({ search, status: filters.status || '' });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`¿Eliminar perfil "${name}"?`)) {
      return;
    }

    destroy(id, () => toast.success('Perfil eliminado exitosamente'));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Perfiles de Laboratorio" />

      <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-6">
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

        <Card>
          <CardHeader>
            <CardTitle>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    placeholder="Buscar por perfil, código o servicio..."
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
                    <th className="px-4 py-3 text-left text-sm font-medium">Perfil</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Servicio</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Parámetros</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {profiles.data.map((profile) => (
                    <tr key={profile.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-mono">{profile.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{profile.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {profile.medical_service?.code} - {profile.medical_service?.name}
                      </td>
                      <td className="px-4 py-3 text-sm">{profile.parameters?.length || 0}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                          {profile.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/medical/laboratory/test-profiles/${profile.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(profile.id, profile.name)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
