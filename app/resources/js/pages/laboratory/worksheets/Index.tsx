import { Head, Link, router } from '@inertiajs/react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Search, Eye, Play, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useWorksheets } from '../../../hooks/useWorksheets';
import { toast } from 'sonner';

interface Worksheet {
  id: number;
  worksheet_number: string;
  worksheet_date: string;
  equipment?: {
    name: string;
  };
  technician?: {
    name: string;
  };
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  items_count: number;
}

interface Props {
  worksheets: {
    data: Worksheet[];
    current_page: number;
    last_page: number;
  };
  equipments: Array<{ id: number; name: string }>;
  technicians: Array<{ id: number; name: string }>;
  filters: {
    search?: string;
    status?: string;
    equipment_id?: string;
    date?: string;
  };
}

export default function WorksheetsIndex({ worksheets, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');
  const [worksheetToComplete, setWorksheetToComplete] = useState<Worksheet | null>(null);
  const { start, complete } = useWorksheets();

  const handleSearch = () => {
    router.get('/medical/laboratory/worksheets', { search, status }, { preserveState: true });
  };

  const handleStart = (id: number) => {
    start(id, () => {
      toast.success('Hoja de trabajo iniciada');
    });
  };

  const handleComplete = () => {
    if (!worksheetToComplete) return;

    complete(worksheetToComplete.id, () => {
      toast.success('Hoja de trabajo completada');
      setWorksheetToComplete(null);
    });
  };

  const getStatusBadge = (status: string) => {
    type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'paid' | 'pending' | 'cancelled';
    const variants: Record<string, { variant: BadgeVariant; label: string }> = {
      draft: { variant: 'secondary', label: 'Borrador' },
      in_progress: { variant: 'pending', label: 'En Proceso' },
      completed: { variant: 'paid', label: 'Completada' },
      cancelled: { variant: 'destructive', label: 'Cancelada' },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AppLayout>
      <Head title="Hojas de Trabajo - Laboratorio" />

      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Hojas de Trabajo</h1>
              <p className="text-sm text-muted-foreground">Organización de pruebas por equipo</p>
            </div>
          </div>
          <Link href="/medical/laboratory/worksheets/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Hoja
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Buscar por número de hoja..."
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
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="in_progress">En Proceso</SelectItem>
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

        <div className="grid gap-4">
          {worksheets.data.map((worksheet) => (
            <Card key={worksheet.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-semibold">{worksheet.worksheet_number}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(worksheet.worksheet_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {getStatusBadge(worksheet.status)}
                </div>
                <div className="flex items-center gap-2">
                  {worksheet.status === 'draft' && (
                    <Button variant="outline" size="sm" onClick={() => handleStart(worksheet.id)}>
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar
                    </Button>
                  )}
                  {worksheet.status === 'in_progress' && (
                    <Button variant="outline" size="sm" onClick={() => setWorksheetToComplete(worksheet)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Completar
                    </Button>
                  )}
                  <Link href={`/medical/laboratory/worksheets/${worksheet.id}`}>
                    <Button variant="default" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalle
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Equipo:</span>
                    <p className="font-medium">{worksheet.equipment?.name || 'Sin asignar'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Técnico:</span>
                    <p className="font-medium">{worksheet.technician?.name || 'Sin asignar'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pruebas:</span>
                    <p className="font-medium">{worksheet.items_count} items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {worksheets.data.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No se encontraron hojas de trabajo</p>
            </CardContent>
          </Card>
        )}

        <AlertDialog open={!!worksheetToComplete} onOpenChange={(open) => !open && setWorksheetToComplete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Completar hoja de trabajo?</AlertDialogTitle>
              <AlertDialogDescription>
                {worksheetToComplete
                  ? `Se marcará la hoja "${worksheetToComplete.worksheet_number}" como completada.`
                  : 'Esta acción confirmará la hoja de trabajo.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleComplete}>Completar hoja</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
