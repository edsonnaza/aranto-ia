import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Link } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNumberFormatter } from '@/hooks/useNumberFormatter';

interface Service {
    id: number;
    name: string;
    code: string;
    lab_area_id: number | null;
    lab_area_code?: string | null;
}

interface LabArea {
    id: number;
    name: string;
    code: string;
}

interface Equipment {
    id: number;
    name: string;
    code: string | null;
    lab_area_id: number | null;
}

interface Parameter {
    name: string;
    code: string;
    parameter_type: 'numeric' | 'text' | 'option' | 'calculated';
    unit?: string;
    is_required: boolean;
    include_in_sum_100: boolean;
    formula?: string;
    reference_ranges: ReferenceRange[];
}

interface ReferenceRange {
    gender: 'male' | 'female' | 'all';
    age_min?: string | number | null;
    age_max?: string | number | null;
    min_value?: string | number | null;
    max_value?: string | number | null;
    reference_text?: string | null;
}

interface FormData {
    medical_service_id: number;
    lab_area_id?: number | null;
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
    [key: string]:
        | string
        | number
        | boolean
        | undefined
        | null
        | number[]
        | Parameter[];
}

interface Props {
    title: string;
    submitLabel: string;
    areas: LabArea[];
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
    reference_ranges: [emptyReferenceRange()],
});

const emptyReferenceRange = (): ReferenceRange => ({
    gender: 'all',
    age_min: '',
    age_max: '',
    min_value: '',
    max_value: '',
    reference_text: '',
});

export default function LabTestProfileForm({
    title,
    submitLabel,
    areas,
    services,
    equipments,
    initialData,
    loading,
    onSubmit,
}: Props) {
    const [form, setForm] = useState<FormData>(initialData);
    const { parse: parseNumber, format: formatNumber } = useNumberFormatter();

    const selectedService = useMemo(
        () =>
            services.find((service) => service.id === form.medical_service_id),
        [services, form.medical_service_id],
    );

    const filteredServices = useMemo(
        () =>
            !form.lab_area_id
                ? []
                : services.filter(
                (service) =>
                    !service.lab_area_id ||
                    service.lab_area_id === form.lab_area_id,
            ),
        [services, form.lab_area_id],
    );

    const canSelectService = Boolean(form.lab_area_id);

    const filteredEquipments = useMemo(
        () =>
            equipments.filter(
                (equipment) =>
                    !form.lab_area_id ||
                    !equipment.lab_area_id ||
                    equipment.lab_area_id === form.lab_area_id,
            ),
        [equipments, form.lab_area_id],
    );

    const addParameter = () => {
        setForm((prev) => ({
            ...prev,
            parameters: [...prev.parameters, emptyParameter()],
        }));
    };

    const removeParameter = (index: number) => {
        setForm((prev) => ({
            ...prev,
            parameters: prev.parameters.filter((_, i) => i !== index),
        }));
    };

    const updateParameter = (
        index: number,
        field: keyof Parameter,
        value: string | boolean | ReferenceRange[],
    ) => {
        setForm((prev) => ({
            ...prev,
            parameters: prev.parameters.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        }));
    };

    const handleIncludeInSum100Change = (
        index: number,
        checked: boolean,
    ) => {
        setForm((prev) => {
            const nextParameters = prev.parameters.map((parameter, currentIndex) =>
                currentIndex === index
                    ? { ...parameter, include_in_sum_100: checked }
                    : parameter,
            );

            return {
                ...prev,
                validation_type: checked ? 'sum_100' : prev.validation_type,
                parameters: nextParameters,
            };
        });
    };

    const addReferenceRange = (parameterIndex: number) => {
        setForm((prev) => ({
            ...prev,
            parameters: prev.parameters.map((parameter, index) =>
                index === parameterIndex
                    ? {
                          ...parameter,
                          reference_ranges: [
                              ...(parameter.reference_ranges || []),
                              emptyReferenceRange(),
                          ],
                      }
                    : parameter,
            ),
        }));
    };

    const removeReferenceRange = (
        parameterIndex: number,
        rangeIndex: number,
    ) => {
        setForm((prev) => ({
            ...prev,
            parameters: prev.parameters.map((parameter, index) =>
                index === parameterIndex
                    ? {
                          ...parameter,
                          reference_ranges:
                              parameter.reference_ranges.length > 1
                                  ? parameter.reference_ranges.filter(
                                        (_, currentRangeIndex) =>
                                            currentRangeIndex !== rangeIndex,
                                    )
                                  : [emptyReferenceRange()],
                      }
                    : parameter,
            ),
        }));
    };

    const updateReferenceRange = (
        parameterIndex: number,
        rangeIndex: number,
        field: keyof ReferenceRange,
        value: string,
    ) => {
        setForm((prev) => ({
            ...prev,
            parameters: prev.parameters.map((parameter, index) =>
                index === parameterIndex
                    ? {
                          ...parameter,
                          reference_ranges: parameter.reference_ranges.map(
                              (range, currentRangeIndex) =>
                                  currentRangeIndex === rangeIndex
                                      ? { ...range, [field]: value }
                                      : range,
                          ),
                      }
                    : parameter,
            ),
        }));
    };

    const normalizeRangeNumericField = (
        parameterIndex: number,
        rangeIndex: number,
        field: 'min_value' | 'max_value',
    ) => {
        const currentValue =
            form.parameters[parameterIndex]?.reference_ranges?.[rangeIndex]?.[
                field
            ] || '';

        if (!String(currentValue).trim()) {
            return;
        }

        const parsed = parseNumber(currentValue);
        if (Number.isNaN(parsed)) {
            return;
        }

        updateReferenceRange(
            parameterIndex,
            rangeIndex,
            field,
            formatNumber(parsed),
        );
    };

    const toggleEquipment = (equipmentId: number) => {
        setForm((prev) => {
            const exists = prev.equipment_ids.includes(equipmentId);
            const equipmentIds = exists
                ? prev.equipment_ids.filter((id) => id !== equipmentId)
                : [...prev.equipment_ids, equipmentId];

            const defaultEquipmentId =
                prev.default_equipment_id &&
                equipmentIds.includes(prev.default_equipment_id)
                    ? prev.default_equipment_id
                    : equipmentIds[0] || null;

            return {
                ...prev,
                equipment_ids: equipmentIds,
                default_equipment_id: defaultEquipmentId,
            };
        });
    };

    const handleAreaChange = (value: string) => {
        const nextAreaId = value ? Number(value) : null;

        setForm((prev) => {
            const selectedServiceForArea = services.find(
                (service) => service.id === prev.medical_service_id,
            );
            const keepSelectedService =
                selectedServiceForArea &&
                (!nextAreaId ||
                    !selectedServiceForArea.lab_area_id ||
                    selectedServiceForArea.lab_area_id === nextAreaId);

            const equipmentIds = prev.equipment_ids.filter((equipmentId) => {
                const equipment = equipments.find(
                    (item) => item.id === equipmentId,
                );

                return equipment
                    ? !nextAreaId ||
                          !equipment.lab_area_id ||
                          equipment.lab_area_id === nextAreaId
                    : false;
            });

            const defaultEquipmentId =
                prev.default_equipment_id &&
                equipmentIds.includes(prev.default_equipment_id)
                    ? prev.default_equipment_id
                    : equipmentIds[0] || null;

            return {
                ...prev,
                lab_area_id: nextAreaId,
                medical_service_id: keepSelectedService
                    ? prev.medical_service_id
                    : 0,
                name: keepSelectedService ? prev.name : '',
                code: keepSelectedService ? prev.code : '',
                equipment_ids: equipmentIds,
                default_equipment_id: defaultEquipmentId,
            };
        });
    };

    const handleServiceChange = (value: string) => {
        const serviceId = Number(value);
        const service = services.find((item) => item.id === serviceId);

        setForm((prev) => {
            const nextAreaId = service?.lab_area_id ?? prev.lab_area_id ?? null;

            const equipmentIds = prev.equipment_ids.filter((equipmentId) => {
                const equipment = equipments.find(
                    (item) => item.id === equipmentId,
                );

                return equipment
                    ? !nextAreaId ||
                          !equipment.lab_area_id ||
                          equipment.lab_area_id === nextAreaId
                    : false;
            });

            const defaultEquipmentId =
                prev.default_equipment_id &&
                equipmentIds.includes(prev.default_equipment_id)
                    ? prev.default_equipment_id
                    : equipmentIds[0] || null;

            return {
                ...prev,
                medical_service_id: serviceId,
                lab_area_id: nextAreaId,
                name: service?.name || prev.name,
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
        onSubmit({
            ...form,
            parameters: form.parameters.map((parameter) => ({
                ...parameter,
                reference_ranges: (parameter.reference_ranges || [])
                    .map((range) => {
                        const minValue = String(range.min_value || '').trim();
                        const maxValue = String(range.max_value || '').trim();
                        const ageMin = String(range.age_min || '').trim();
                        const ageMax = String(range.age_max || '').trim();
                        const referenceText = String(
                            range.reference_text || '',
                        ).trim();

                        const parsedMinValue = minValue
                            ? parseNumber(minValue)
                            : Number.NaN;
                        const parsedMaxValue = maxValue
                            ? parseNumber(maxValue)
                            : Number.NaN;

                        return {
                            gender: range.gender || 'all',
                            age_min: ageMin ? Number(ageMin) : null,
                            age_max: ageMax ? Number(ageMax) : null,
                            min_value:
                                minValue && !Number.isNaN(parsedMinValue)
                                    ? String(parsedMinValue)
                                    : null,
                            max_value:
                                maxValue && !Number.isNaN(parsedMaxValue)
                                    ? String(parsedMaxValue)
                                    : null,
                            reference_text: referenceText || null,
                        };
                    })
                    .filter(
                        (range) =>
                            range.age_min !== null ||
                            range.age_max !== null ||
                            range.min_value !== null ||
                            range.max_value !== null ||
                            range.reference_text !== null,
                    ),
            })),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="lab_area_id">
                                Area de laboratorio
                            </Label>
                            <Select
                                value={
                                    form.lab_area_id
                                        ? String(form.lab_area_id)
                                        : ''
                                }
                                onValueChange={handleAreaChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione area" />
                                </SelectTrigger>
                                <SelectContent>
                                    {areas.map((area) => (
                                        <SelectItem
                                            key={area.id}
                                            value={String(area.id)}
                                        >
                                            {area.code} - {area.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="medical_service_id">
                                Servicio de laboratorio
                            </Label>
                            <Select
                                value={
                                    form.medical_service_id
                                        ? String(form.medical_service_id)
                                        : ''
                                }
                                onValueChange={handleServiceChange}
                                disabled={!canSelectService}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            canSelectService
                                                ? 'Seleccione servicio'
                                                : 'Seleccione area primero'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredServices.map((service) => (
                                        <SelectItem
                                            key={service.id}
                                            value={String(service.id)}
                                        >
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
                                onValueChange={(value) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        status: value as 'active' | 'inactive',
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Activo
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactivo
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="name">Nombre del perfil</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="code">Código del perfil</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="code"
                                    value={form.code}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            code: e.target.value,
                                        }))
                                    }
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={buildCodeFromService}
                                >
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
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <Label htmlFor="validation_type">
                                Regla de validación
                            </Label>
                            <Select
                                value={form.validation_type}
                                onValueChange={(value) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        validation_type: value as
                                            | 'none'
                                            | 'sum_100',
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Sin validación adicional
                                    </SelectItem>
                                    <SelectItem value="sum_100">
                                        Suma porcentual = 100%
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="validation_target">
                                Objetivo de suma
                            </Label>
                            <Input
                                id="validation_target"
                                type="number"
                                step="0.01"
                                value={form.validation_target}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        validation_target:
                                            Number(e.target.value) || 0,
                                    }))
                                }
                                disabled={form.validation_type !== 'sum_100'}
                            />
                        </div>

                        <div>
                            <Label htmlFor="validation_tolerance">
                                Tolerancia (+/-)
                            </Label>
                            <Input
                                id="validation_tolerance"
                                type="number"
                                step="0.01"
                                value={form.validation_tolerance}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        validation_tolerance:
                                            Number(e.target.value) || 0,
                                    }))
                                }
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
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {filteredEquipments.map((equipment) => {
                            const checked = form.equipment_ids.includes(
                                equipment.id,
                            );
                            return (
                                <label
                                    key={equipment.id}
                                    className="flex cursor-pointer items-center justify-between rounded border px-3 py-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={() =>
                                                toggleEquipment(equipment.id)
                                            }
                                        />
                                        <span className="text-sm">
                                            {equipment.code
                                                ? `${equipment.code} - `
                                                : ''}
                                            {equipment.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {equipment.lab_area_id
                                                ? 'Equipo del area seleccionada'
                                                : 'Equipo compartido'}
                                        </span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    <div>
                        <Label htmlFor="default_equipment">
                            Equipo por defecto
                        </Label>
                        <Select
                            value={
                                form.default_equipment_id
                                    ? String(form.default_equipment_id)
                                    : ''
                            }
                            onValueChange={(value) =>
                                setForm((prev) => ({
                                    ...prev,
                                    default_equipment_id: Number(value),
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione equipo por defecto" />
                            </SelectTrigger>
                            <SelectContent>
                                {form.equipment_ids.map((equipmentId) => {
                                    const equipment = equipments.find(
                                        (item) => item.id === equipmentId,
                                    );
                                    if (!equipment) {
                                        return null;
                                    }

                                    return (
                                        <SelectItem
                                            key={equipment.id}
                                            value={String(equipment.id)}
                                        >
                                            {equipment.code
                                                ? `${equipment.code} - `
                                                : ''}
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
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={addParameter}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar parámetro
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {form.parameters.map((parameter, index) => (
                        <div
                            key={`${parameter.code}-${index}`}
                            className="space-y-3 rounded border p-4"
                        >
                            {(() => {
                                const parameterLabel =
                                    parameter.name?.trim() ||
                                    parameter.code?.trim() ||
                                    `Parametro ${index + 1}`;
                                const usesNumericRanges =
                                    parameter.parameter_type === 'numeric' ||
                                    parameter.parameter_type === 'calculated';
                                const usesFormula =
                                    parameter.parameter_type === 'calculated';

                                return (
                                    <>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                <div>
                                    <Label>Nombre</Label>
                                    <Input
                                        value={parameter.name}
                                        onChange={(e) =>
                                            updateParameter(
                                                index,
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Código</Label>
                                    <Input
                                        value={parameter.code}
                                        onChange={(e) =>
                                            updateParameter(
                                                index,
                                                'code',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Tipo</Label>
                                    <Select
                                        value={parameter.parameter_type}
                                        onValueChange={(value) =>
                                            updateParameter(
                                                index,
                                                'parameter_type',
                                                value as Parameter['parameter_type'],
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="numeric">
                                                Numérico
                                            </SelectItem>
                                            <SelectItem value="text">
                                                Texto
                                            </SelectItem>
                                            <SelectItem value="option">
                                                Opción
                                            </SelectItem>
                                            <SelectItem value="calculated">
                                                Calculado
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Unidad</Label>
                                    <Input
                                        value={parameter.unit || ''}
                                        onChange={(e) =>
                                            updateParameter(
                                                index,
                                                'unit',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div>
                                    <Label>
                                        {usesFormula
                                            ? 'Fórmula de cálculo'
                                            : 'Observación de parámetro'}
                                    </Label>
                                    <Input
                                        value={parameter.formula || ''}
                                        onChange={(e) =>
                                            updateParameter(
                                                index,
                                                'formula',
                                                e.target.value,
                                            )
                                        }
                                        placeholder={
                                            usesFormula
                                                ? 'Ej: (AST + ALT) / 2'
                                                : 'Opcional'
                                        }
                                        disabled={!usesFormula}
                                    />
                                </div>
                                <div className="flex items-center justify-between md:pt-6">
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={parameter.is_required}
                                                onCheckedChange={(checked) =>
                                                    updateParameter(
                                                        index,
                                                        'is_required',
                                                        Boolean(checked),
                                                    )
                                                }
                                            />
                                            Requerido
                                        </label>

                                        <label className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={
                                                    parameter.include_in_sum_100
                                                }
                                                onCheckedChange={(checked) =>
                                                    handleIncludeInSum100Change(
                                                        index,
                                                        Boolean(checked),
                                                    )
                                                }
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

                            <div className="rounded border border-dashed p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <Label>
                                            Referencias de {parameterLabel}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {usesNumericRanges
                                                ? 'Este bloque corresponde solo a este parametro. Cargue aqui el rango normal que aplique para este item.'
                                                : 'Este bloque corresponde solo a este parametro y permite guardar una referencia textual.'}
                                        </p>
                                        {parameter.include_in_sum_100 &&
                                        form.validation_type === 'sum_100' ? (
                                            <p className="mt-1 text-xs text-amber-700">
                                                Este parámetro participa en la suma porcentual del perfil.
                                            </p>
                                        ) : null}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => addReferenceRange(index)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar rango
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {parameter.reference_ranges.map(
                                        (range, rangeIndex) => (
                                            <div
                                                key={`${parameter.code || 'range'}-${rangeIndex}`}
                                                className="rounded border p-3"
                                            >
                                                <div
                                                    className={`grid grid-cols-1 gap-3 ${
                                                        usesNumericRanges
                                                            ? 'md:grid-cols-6'
                                                            : 'md:grid-cols-3'
                                                    }`}
                                                >
                                                    <div>
                                                        <Label>Sexo</Label>
                                                        <Select
                                                            value={range.gender}
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                updateReferenceRange(
                                                                    index,
                                                                    rangeIndex,
                                                                    'gender',
                                                                    value,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">
                                                                    Todos
                                                                </SelectItem>
                                                                <SelectItem value="male">
                                                                    Masculino
                                                                </SelectItem>
                                                                <SelectItem value="female">
                                                                    Femenino
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div>
                                                        <Label>Edad min</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={range.age_min || ''}
                                                            onChange={(e) =>
                                                                updateReferenceRange(
                                                                    index,
                                                                    rangeIndex,
                                                                    'age_min',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>Edad max</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={range.age_max || ''}
                                                            onChange={(e) =>
                                                                updateReferenceRange(
                                                                    index,
                                                                    rangeIndex,
                                                                    'age_max',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    {usesNumericRanges && (
                                                        <>
                                                            <div>
                                                                <Label>Min</Label>
                                                                <Input
                                                                    value={range.min_value || ''}
                                                                    onChange={(e) =>
                                                                        updateReferenceRange(
                                                                            index,
                                                                            rangeIndex,
                                                                            'min_value',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    onBlur={() =>
                                                                        normalizeRangeNumericField(
                                                                            index,
                                                                            rangeIndex,
                                                                            'min_value',
                                                                        )
                                                                    }
                                                                    placeholder="Valor minimo"
                                                                />
                                                            </div>

                                                            <div>
                                                                <Label>Max</Label>
                                                                <Input
                                                                    value={range.max_value || ''}
                                                                    onChange={(e) =>
                                                                        updateReferenceRange(
                                                                            index,
                                                                            rangeIndex,
                                                                            'max_value',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    onBlur={() =>
                                                                        normalizeRangeNumericField(
                                                                            index,
                                                                            rangeIndex,
                                                                            'max_value',
                                                                        )
                                                                    }
                                                                    placeholder="Valor maximo"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="flex items-end justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                removeReferenceRange(
                                                                    index,
                                                                    rangeIndex,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <Label>
                                                        {usesNumericRanges
                                                            ? 'Texto adicional de referencia'
                                                            : 'Texto de referencia'}
                                                    </Label>
                                                    <Input
                                                        value={
                                                            range.reference_text ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            updateReferenceRange(
                                                                index,
                                                                rangeIndex,
                                                                'reference_text',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Opcional: Ayuno, Negativo, Deseable..."
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                                    </>
                                );
                            })()}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Link href="/medical/laboratory/test-profiles">
                    <Button type="button" variant="outline">
                        Cancelar
                    </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
