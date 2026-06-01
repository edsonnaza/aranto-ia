import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/resources/js/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/resources/js/components/ui/card';
import { Button } from '@/resources/js/components/ui/button';
import { Badge } from '@/resources/js/components/ui/badge';
import { ArrowLeft, ClipboardList, User, Calendar, Clock, AlertCircle } from 'lucide-react';

interface TestRequest {
  id: number;
  sample: {
    sample_number: string;
    patient: {
      first_name: string;
      last_name: string;
    };
    sample_type?: {
      name: string;
    };
  };
  test_profile: {
    name: string;
  };
  priority: string;
  status: string;
  requested_by: {
    name: string;
  };
  assigned_to?: {
    name: string;
  };
  started_at?: string;
  completed_at?: string;
  notes?: string;
  results?: Array<{
    id: number;
    parameter: { name: string };
    value: string;
    is_out_of_range: boolean;
  }>;
  validations?: Array<{
    id: number;
    validated_by: { name: string };
    validated_at: string;
  }>;
}

interface Props {
  testRequest: TestRequest;
}

export default function TestRequestShow({ testRequest }: Props) {
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
      validated: { variant: 'success', label: 'Validada' },
      cancelled: { variant: 'destructive', label: 'Cancelada' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AppLayout>
      <Head title={`Solicitud #${testRequest.id} - Laboratorio`} />

      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/medical/laboratory/test-requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Solicitud #{testRequest.id}
              </h1>
              <p className="text-sm text-muted-foreground">
                Muestra: {testRequest.sample.sample_number}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {getPriorityBadge(testRequest.priority)}
            {getStatusBadge(testRequest.status)}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información del Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Paciente</span>
                <p className="font-medium">
                  {testRequest.sample.patient.first_name} {testRequest.sample.patient.last_name}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Tipo de Muestra</span>
                <p className="font-medium">{testRequest.sample.sample_type?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Número de Muestra</span>
                <p className="font-medium font-mono">{testRequest.sample.sample_number}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Solicitud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Prueba Solicitada</span>
                <p className="font-medium">{testRequest.test_profile.name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Solicitado por</span>
                <p className="font-medium">{testRequest.requested_by.name}</p>
              </div>
              {testRequest.assigned_to && (
                <div>
                  <span className="text-sm text-muted-foreground">Asignado a</span>
                  <p className="font-medium">{testRequest.assigned_to.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {testRequest.results && testRequest.results.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-sm font-medium">Parámetro</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Valor</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {testRequest.results.map((result) => (
                      <tr key={result.id}>
                        <td className="px-4 py-2 text-sm">{result.parameter.name}</td>
                        <td className="px-4 py-2 text-sm font-medium">{result.value}</td>
                        <td className="px-4 py-2 text-sm">
                          {result.is_out_of_range && (
                            <Badge variant="destructive">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Fuera de rango
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {testRequest.notes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{testRequest.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
