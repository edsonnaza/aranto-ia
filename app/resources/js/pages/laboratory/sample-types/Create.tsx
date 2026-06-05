import { Head, router } from '@inertiajs/react';
import AppLayout from '../../../layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useSampleTypes } from '../../../hooks/useSampleTypes';
import { toast } from 'sonner';

export default function SampleTypesCreate() {
  const { create, loading } = useSampleTypes();
  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/laboratory', title: 'Laboratorio' },
    { href: '/medical/laboratory/sample-types', title: 'Tipos de Muestra' },
    { href: '/medical/laboratory/sample-types/create', title: 'Nuevo', current: true },
  ];

  const [form, setForm] = useState<{
    name: string;
    code: string;
    description: string;
    container_type: string;
    preservation_requirements: string;
    stability_hours: string;
    status: 'active' | 'inactive';
  }>({
    name: '',
    code: '',
    description: '',
    container_type: '',
    preservation_requirements: '',
    stability_hours: '',
    status: 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create({ ...form, stability_hours: form.stability_hours ? Number(form.stability_hours) : undefined }, () => {
      toast.success('Tipo de muestra creado exitosamente');
      router.visit('/medical/laboratory/sample-types');
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Nuevo Tipo de Muestra" />

      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.visit('/medical/laboratory/sample-types')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
       
          <div>
            <h1 className="text-lg font-bold tracking-tight">Nuevo Tipo de Muestra</h1>
            <p className="text-sm text-muted-foreground">Crear nuevo tipo de muestra de laboratorio</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Datos del Tipo de Muestra</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="container_type">Tipo de Contenedor *</Label>
                  <Input
                    id="container_type"
                    value={form.container_type}
                    onChange={(e) => setForm({ ...form, container_type: e.target.value })}
                    placeholder="Ej: Tubo EDTA, Tubo SST"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stability_hours">Estabilidad (horas)</Label>
                  <Input
                    id="stability_hours"
                    type="number"
                    min="0"
                    value={form.stability_hours}
                    onChange={(e) => setForm({ ...form, stability_hours: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preservation_requirements">Requisitos de Conservación</Label>
                <Textarea
                  id="preservation_requirements"
                  value={form.preservation_requirements}
                  onChange={(e) => setForm({ ...form, preservation_requirements: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v: 'active' | 'inactive') => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Crear Tipo de Muestra'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.visit('/medical/laboratory/sample-types')}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
