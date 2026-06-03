import { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  code: string;
}

interface Equipment {
  id: number;
  name: string;
  code: string | null;
}

interface Parameter {
  name: string;
  code: string;
  parameter_type: 'numeric' | 'text' | 'option' | 'calculated';
  unit?: string;
  is_required: boolean;
  include_in_sum_100: boolean;
  formula?: string;
}

interface FormData {
  medical_service_id: number;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  validation_type: 'none' | 'sum_100';
  validation_target: number;
  validation_tolerance: number;
  equipment_ids: number[];
  default_equipment_id?: number | null;
  parameters: Parameter[];
  [key: string]: string | number | boolean | undefined | null | number[] | Parameter[];
}

interface Props {
  title: string;
  submitLabel: string;
  services: Service[];
  equipments: Equipment[];
  initialData: FormData;
  loading: boolean;
  onSubmit: (data: FormData) => void;
}

const emptyParameter = (): Parameter => ({
  name: '',
  code: '',
  parameter_type: 'numeric',
  unit: '',
  is_required: true,
  include_in_sum_100: false,
  formula: '',
});

export default function LabTestProfileForm({
  title,
  submitLabel,
  services,
  equipments,
  initialData,
  loading,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<FormData>(initialData);

  const selectedService = useMemo(
    () => services.find((service) => service.id === form.medical_service_id),
    [services, form.medical_service_id]
  );

  const addParameter = () => {
    setForm((prev) => ({ ...prev, parameters: [...prev.parameters, emptyParameter()] }));
  };

  const removeParameter = (index: number) => {
    setForm((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  const updateParameter = (index: number, field: keyof Parameter, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      parameters: prev.parameters.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const toggleEquipment = (equipmentId: number) => {
    setForm((prev) => {
      const exists = prev.equipment_ids.includes(equipmentId);
      const equipmentIds = exists
        ? prev.equipment_ids.filter((id) => id !== equipmentId)
        : [...prev.equipment_ids, equipmentId];

      const defaultEquipmentId =
        prev.default_equipment_id && equipmentIds.includes(prev.default_equipment_id)
          ? prev.default_equipment_id
          : equipmentIds[0] || null;

      return {
        ...prev,
        equipment_ids: equipmentIds,
        default_equipment_id: defaultEquipmentId,
      };
    });
  };

  const buildCodeFromService = () => {
    if (!selectedService) {
      return;
    }

    const normalized = selectedService.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    setForm((prev) => ({ ...prev, code: normalized.slice(0, 50) }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="medical_service_id">Servicio de laboratorio</Label>
              <Select
                value={form.medical_service_id ? String(form.medical_service_id) : ''}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    medical_service_id: Number(value),
                    name: services.find((service) => service.id === Number(value))?.name || prev.name,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={String(service.id)}>
                      {service.code} - {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as 'active' | 'inactive' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre del perfil</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="code">Código del perfil</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  required
                />
                <Button type="button" variant="secondary" onClick={buildCodeFromService}>
                  Sugerir
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.description || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="validation_type">Regla de validación</Label>
              <Select
                value={form.validation_type}
                onValueChange={(value) => setForm((prev) => ({ ...prev, validation_type: value as 'none' | 'sum_100' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin validación adicional</SelectItem>
                  <SelectItem value="sum_100">Suma porcentual = 100%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="validation_target">Objetivo de suma</Label>
              <Input
                id="validation_target"
                type="number"
                step="0.01"
                value={form.validation_target}
                onChange={(e) => setForm((prev) => ({ ...prev, validation_target: Number(e.target.value) || 0 }))}
                disabled={form.validation_type !== 'sum_100'}
              />
            </div>

            <div>
              <Label htmlFor="validation_tolerance">Tolerancia (+/-)</Label>
              <Input
                id="validation_tolerance"
                type="number"
                step="0.01"
                value={form.validation_tolerance}
                onChange={(e) => setForm((prev) => ({ ...prev, validation_tolerance: Number(e.target.value) || 0 }))}
                disabled={form.validation_type !== 'sum_100'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipos vinculados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {equipments.map((equipment) => {
              const checked = form.equipment_ids.includes(equipment.id);
              return (
                <label
                  key={equipment.id}
                  className="flex items-center justify-between rounded border px-3 py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={checked} onCheckedChange={() => toggleEquipment(equipment.id)} />
                    <span className="text-sm">
                      {equipment.code ? `${equipment.code} - ` : ''}
                      {equipment.name}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          <div>
            <Label htmlFor="default_equipment">Equipo por defecto</Label>
            <Select
              value={form.default_equipment_id ? String(form.default_equipment_id) : ''}
              onValueChange={(value) => setForm((prev) => ({ ...prev, default_equipment_id: Number(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione equipo por defecto" />
              </SelectTrigger>
              <SelectContent>
                {form.equipment_ids.map((equipmentId) => {
                  const equipment = equipments.find((item) => item.id === equipmentId);
                  if (!equipment) {
                    return null;
                  }

                  return (
                    <SelectItem key={equipment.id} value={String(equipment.id)}>
                      {equipment.code ? `${equipment.code} - ` : ''}
                      {equipment.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Parámetros del perfil</span>
            <Button type="button" variant="secondary" onClick={addParameter}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar parámetro
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.parameters.map((parameter, index) => (
            <div key={`${parameter.code}-${index}`} className="rounded border p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={parameter.name}
                    onChange={(e) => updateParameter(index, 'name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Código</Label>
                  <Input
                    value={parameter.code}
                    onChange={(e) => updateParameter(index, 'code', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={parameter.parameter_type}
                    onValueChange={(value) =>
                      updateParameter(index, 'parameter_type', value as Parameter['parameter_type'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numeric">Numérico</SelectItem>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="option">Opción</SelectItem>
                      <SelectItem value="calculated">Calculado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unidad</Label>
                  <Input
                    value={parameter.unit || ''}
                    onChange={(e) => updateParameter(index, 'unit', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Fórmula (si aplica)</Label>
                  <Input
                    value={parameter.formula || ''}
                    onChange={(e) => updateParameter(index, 'formula', e.target.value)}
                    placeholder="Ej: (AST + ALT) / 2"
                  />
                </div>
                <div className="flex items-center justify-between md:pt-6">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={parameter.is_required}
                        onCheckedChange={(checked) => updateParameter(index, 'is_required', Boolean(checked))}
                      />
                      Requerido
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={parameter.include_in_sum_100}
                        onCheckedChange={(checked) => updateParameter(index, 'include_in_sum_100', Boolean(checked))}
                        disabled={form.validation_type !== 'sum_100'}
                      />
                      Incluye en suma 100%
                    </label>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeParameter(index)}
                    disabled={form.parameters.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href="/medical/laboratory/test-profiles">
          <Button type="button" variant="outline">Cancelar</Button>
        </Link>
        <Button type="submit" disabled={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
