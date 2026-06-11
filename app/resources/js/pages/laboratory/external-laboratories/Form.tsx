import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface ExternalLaboratoryFormValues {
    name: string;
    contact_name: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    notes: string;
    status: 'active' | 'inactive';
}

interface Props {
    title: string;
    submitLabel: string;
    loading: boolean;
    initialValues: ExternalLaboratoryFormValues;
    onSubmit: (values: ExternalLaboratoryFormValues) => void;
}

export default function ExternalLaboratoryForm({
    title,
    submitLabel,
    loading,
    initialValues,
    onSubmit,
}: Props) {
    const [form, setForm] = useState<ExternalLaboratoryFormValues>(initialValues);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...form,
            name: form.name.trim(),
            contact_name: form.contact_name.trim(),
            phone: form.phone.trim(),
            whatsapp: form.whatsapp.trim(),
            email: form.email.trim(),
            address: form.address.trim(),
            notes: form.notes.trim(),
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
                            <Label htmlFor="contact_name">Contacto</Label>
                            <Input
                                id="contact_name"
                                value={form.contact_name}
                                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input
                                id="whatsapp"
                                value={form.whatsapp}
                                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado *</Label>
                            <Select
                                value={form.status}
                                onValueChange={(value: 'active' | 'inactive') =>
                                    setForm({ ...form, status: value })
                                }
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                            id="address"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            rows={4}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : submitLabel}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/medical/laboratory/external-laboratories')}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
