import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../../layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../Components/ui/card';
import { Button } from '../../../Components/ui/button';
import { Badge } from '../../../Components/ui/badge';
import { Input } from '../../../Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../Components/ui/select';
import { ClipboardList, Plus, Search, Eye, UserCheck, Play, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTestRequests } from '../../../hooks/useTestRequests';
import { toast } from 'sonner';

interface TestRequest {
  id: number;
  sample: {
    sample_number: string;
    patient: {
      first_name: string;
      last_name: string;
    };
  };
  test_profile: {
    name: string;
  };
  priority: 'routine' | 'urgent' | 'stat';
  status: string;
  assigned_to?: {
    name: string;
  };
  created_at: string;
}

interface Props {
  testRequests: {
    data: TestRequest[];
    current_page: number;
    last_page: number;
  };
  technicians: Array<{ id: number; name: string }>;
  filters: {
    search?: string;
    status?: string;
    priority?: string;
  };
}

export default function TestRequestsIndex({ testRequests, technicians, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');
  const [priority, setPriority] = useState(filters.priority || '');
  const { assign, start, complete, destroy } = useTestRequests();

  const handleSearch = () => {
    router.get('/medical/laboratory/test-requests', { search, status, priority }, { preserveState: true });
  };

  const handleAssign = (id: number, technicianId: number) => {
    assign(id, technicianId, () => {
      toast.success('Técnico asignado exitosamente');
    });
  };

  const handleStart = (id: number) => {
    start(id, () => {
      toast.success('Solicitud iniciada');
    });
  };

  const handleComplete = (id: number) => {
    complete(id, () => {
      toast.success('Solicitud completada');
    });
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      routine: { variant: 'default', label: 'Rutina' },
      urgent: { variant: 'warning', label: 'Urgente' },
      stat: { variant: 'destructive', label: 'STAT' },
    };
    const config = variants[priority] || variants.routine;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pendiente' },
      assigned: { variant: 'default', label: 'Asignada' },
      in_process: { variant: 'warning', label: 'En Proceso' },
      completed: { variant: 'success', label: 'Completada' },
      cancelled: { variant: 'destructive', label: 'Cancelada' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AppLayout>
      <Head title="Solicitudes de Pruebas - Laboratorio" />

      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Solicitudes de Pruebas</h1>
              <p className="text-sm text-muted-foreground">Gestión de solicitudes de análisis</p>
            </div>
          </div>
          <Link href="/medical/laboratory/test-requests/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Solicitud
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Buscar por número de muestra..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="assigned">Asignada</SelectItem>
                  <SelectItem value="in_process">En Proceso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">Muestra</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Paciente</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Prueba</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Prioridad</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Técnico</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {testRequests.data.map((request) => (
                    <tr key={request.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-mono">{request.sample.sample_number}</td>
                      <td className="px-4 py-3 text-sm">
                        {request.sample.patient.first_name} {request.sample.patient.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm">{request.test_profile.name}</td>
                      <td className="px-4 py-3 text-sm">{getPriorityBadge(request.priority)}</td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(request.status)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {request.assigned_to?.name || 'Sin asignar'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex justify-end gap-2">
                          <Link href={`/medical/laboratory/test-requests/${request.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {request.status === 'assigned' && (
                            <Button variant="ghost" size="sm" onClick={() => handleStart(request.id)}>
                              <Play className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {request.status === 'in_process' && (
                            <Button variant="ghost" size="sm" onClick={() => handleComplete(request.id)}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
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
