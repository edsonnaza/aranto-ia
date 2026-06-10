import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type EquipmentStatus = 'active' | 'maintenance' | 'inactive';

interface Area {
    id: number;
    name: string;
    code: string;
}

export interface EquipmentFormValues {
    name: string;
    code: string;
    manufacturer: string;
    model: string;
    serial_number: string;
    department: string;
    lab_area_id: number | null;
    status: EquipmentStatus;
    notes: string;
}

interface Props {
    title: string;
    submitLabel: string;
    loading: boolean;
    areas: Area[];
    initialValues: EquipmentFormValues;
    onSubmit: (values: EquipmentFormValues) => void;
}

export default function EquipmentForm({
    title,
    submitLabel,
    loading,
    areas,
    initialValues,
    onSubmit,
}: Props) {
    const [form, setForm] = useState<EquipmentFormValues>(initialValues);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...form,
            code: form.code.trim().toUpperCase(),
            lab_area_id: form.lab_area_id || null,
        });
    };

    return (
        <Card className="max-w-4xl">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
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
                            <Label htmlFor="code">Codigo</Label>
                            <Input
                                id="code"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                placeholder="Ej: HEMA-01"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="lab_area_id">Area de laboratorio</Label>
                            <Select
                                value={form.lab_area_id ? String(form.lab_area_id) : 'shared'}
                                onValueChange={(value) =>
                                    setForm({
                                        ...form,
                                        lab_area_id: value === 'shared' ? null : Number(value),
                                    })
                                }
                            >
                                <SelectTrigger id="lab_area_id">
                                    <SelectValue placeholder="Seleccione area" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="shared">Compartido / sin area</SelectItem>
                                    {areas.map((area) => (
                                        <SelectItem key={area.id} value={String(area.id)}>
                                            {area.code} - {area.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado *</Label>
                            <Select
                                value={form.status}
                                onValueChange={(value: EquipmentStatus) =>
                                    setForm({ ...form, status: value })
                                }
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="manufacturer">Fabricante</Label>
                            <Input
                                id="manufacturer"
                                value={form.manufacturer}
                                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="model">Modelo</Label>
                            <Input
                                id="model"
                                value={form.model}
                                onChange={(e) => setForm({ ...form, model: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="serial_number">Numero de serie</Label>
                            <Input
                                id="serial_number"
                                value={form.serial_number}
                                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Departamento / Sector</Label>
                            <Input
                                id="department"
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={4}
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : submitLabel}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/medical/laboratory/equipments')}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
