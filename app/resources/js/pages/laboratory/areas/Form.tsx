import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface AreaFormValues {
    name: string;
    code: string;
    description: string;
    status: 'active' | 'inactive';
    display_order: string;
}

interface Props {
    title: string;
    submitLabel: string;
    loading: boolean;
    initialValues: AreaFormValues;
    onSubmit: (values: AreaFormValues) => void;
}

export default function AreaForm({
    title,
    submitLabel,
    loading,
    initialValues,
    onSubmit,
}: Props) {
    const [form, setForm] = useState<AreaFormValues>(initialValues);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...form,
            code: form.code.trim().toUpperCase(),
        });
    };

    return (
        <Card className="max-w-3xl">
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
                            <Label htmlFor="code">Código *</Label>
                            <Input
                                id="code"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="display_order">Orden de visualización</Label>
                            <Input
                                id="display_order"
                                type="number"
                                min="0"
                                value={form.display_order}
                                onChange={(e) => setForm({ ...form, display_order: e.target.value })}
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
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            rows={4}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : submitLabel}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/medical/laboratory/areas')}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
