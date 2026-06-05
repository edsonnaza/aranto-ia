import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/layouts/app-layout';

// Tipos e interfaces actualizados para coincidir con la base de datos real
interface ServicePrice {
    id: number;
    insurance_type_id: number;
    price: string;
    effective_from: string;
    effective_until?: string;
    notes?: string;
    insurance_type: {
        id: number;
        name: string;
        code?: string;
    };
}

interface MedicalService {
    id: number;
    name: string;
    code: string;
    description?: string;
    category_id?: number;
    duration_minutes: number;
    requires_appointment: boolean;
    requires_preparation: boolean;
    preparation_instructions?: string;
    default_commission_percentage: number;
    status: 'active' | 'inactive';
    prices?: ServicePrice[];
    category?: {
        id: number;
        name: string;
    };
}

interface ServiceCategory {
    id: number;
    name: string;
    description?: string;
}

interface InsuranceType {
    id: number;
    name: string;
    code?: string;
}

interface MedicalServicesEditProps {
    service: MedicalService;
    categories: ServiceCategory[];
    insuranceTypes: InsuranceType[];
    statusOptions: Array<{value: string; label: string}>;
}

// Esquema de validación Zod
const serviceSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(255),
    code: z.string().min(1, 'El código es requerido').max(50),
    description: z.string().optional(),
    category_id: z.string().optional(),
    duration_minutes: z.number().min(1, 'La duración debe ser mayor a 0'),
    requires_appointment: z.boolean(),
    requires_preparation: z.boolean(),
    preparation_instructions: z.string().optional(),
    default_commission_percentage: z.number().min(0).max(100),
    status: z.enum(['active', 'inactive']),
    prices: z.array(z.object({
        insurance_type_id: z.number(),
        price: z.string().min(1, 'El precio es requerido'),
        effective_from: z.string(),
        effective_until: z.string().optional(),
        notes: z.string().optional(),
    })).optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface PriceForm {
    id: string;
    insurance_type_id: number;
    price: string;
    effective_from: string;
    effective_until?: string;
    notes?: string;
}

const MedicalServicesEdit = ({ service, categories = [], insuranceTypes = [], statusOptions = [] }: MedicalServicesEditProps) => {
    // Estados locales para manejar precios
    const [prices, setPrices] = useState<PriceForm[]>([]);
    const [showPricesSection, setShowPricesSection] = useState(false);

    // Configuración de React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        setValue
    } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: service.name,
            code: service.code,
            description: service.description || '',
            category_id: service.category_id?.toString() || '',
            duration_minutes: service.duration_minutes,
            requires_appointment: service.requires_appointment,
            requires_preparation: service.requires_preparation,
            preparation_instructions: service.preparation_instructions || '',
            default_commission_percentage: service.default_commission_percentage,
            status: service.status,
        }
    });

    const requiresPreparation = watch('requires_preparation');

    // Agregar precio personalizado
    const addCustomPrice = () => {
        const unusedInsurance = safeInsuranceTypes.find(
            type => !customPrices.some(price => price.insurance_type_id === type.id)
        );

        if (unusedInsurance) {
            setCustomPrices([...customPrices, {
                insurance_type_id: unusedInsurance.id,
                price: safeService.base_price,
                is_active: true
            }]);
        }
    };

    // Remover precio personalizado
    const removeCustomPrice = (index: number) => {
        setCustomPrices(customPrices.filter((_, i) => i !== index));
    };

    // Actualizar precio personalizado
    const updateCustomPrice = (index: number, field: keyof typeof customPrices[0], value: string | number | boolean) => {
        const updatedPrices = [...customPrices];
        updatedPrices[index] = { ...updatedPrices[index], [field]: value };
        setCustomPrices(updatedPrices);
        setValue('prices', updatedPrices);
    };

    // Envío del formulario
    const onSubmit = (data: ServiceFormData) => {
        const formData = {
            ...data,
            category_id: data.category_id ? parseInt(data.category_id) : null,
            prices: showAdvancedPricing ? customPrices : []
        };

        router.put(`/medical/medical-services/${safeService.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                // Opcional: mostrar mensaje de éxito
            }
        });
    };

    // Obtener nombre de tipo de seguro
    const getInsuranceTypeName = (id: number) => {
        const insuranceType = safeInsuranceTypes.find(type => type.id === id);
        return insuranceType?.name || 'Desconocido';
    };

    // Obtener color de tipo de seguro
    const getInsuranceTypeColor = (id: number) => {
        const insuranceType = safeInsuranceTypes.find(type => type.id === id);
        return insuranceType?.color || '#6B7280';
    };

    return (
        <AppLayout>
            <Head title="Editar Servicio Médico" />
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                    Editar Servicio Médico
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Información básica */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre del servicio
                                        </label>
                                        <input
                                            type="text"
                                            {...register('name')}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ej: Consulta General"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Código del servicio
                                        </label>
                                        <input
                                            type="text"
                                            {...register('code')}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ej: CONS-001"
                                        />
                                        {errors.code && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.code.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        {...register('description')}
                                        rows={3}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Descripción del servicio..."
                                    />
                                </div>

                                {/* Categoría y precio base */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Categoría
                                        </label>
                                        <select
                                            {...register('category_id')}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">Sin categoría</option>
                                            {safeCategories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Precio base (BOB)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register('base_price')}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="0.00"
                                        />
                                        {errors.base_price && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.base_price.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-end">
                                        <div className="flex items-center h-10">
                                            <input
                                                type="checkbox"
                                                {...register('is_active')}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 block text-sm text-gray-900">
                                                Servicio activo
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Precios por tipo de seguro */}
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Precios por tipo de seguro
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
                                            className="text-sm text-indigo-600 hover:text-indigo-500"
                                        >
                                            {showAdvancedPricing ? 'Ocultar' : 'Configurar precios específicos'}
                                        </button>
                                    </div>

                                    {showAdvancedPricing && (
                                        <div className="space-y-4">
                                            {customPrices.map((price, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-4 p-4 bg-white rounded-lg border"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: getInsuranceTypeColor(price.insurance_type_id) }}
                                                        />
                                                        <span className="text-sm font-medium text-gray-700 min-w-120px">
                                                            {getInsuranceTypeName(price.insurance_type_id)}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={price.price}
                                                            onChange={(e) => updateCustomPrice(index, 'price', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="0.00"
                                                        />
                                                    </div>

                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={price.is_active}
                                                            onChange={(e) => updateCustomPrice(index, 'is_active', e.target.checked)}
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                        />
                                                        <label className="ml-2 text-sm text-gray-700">Activo</label>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeCustomPrice(index)}
                                                        className="p-2 text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            {customPrices.length < safeInsuranceTypes.length && (
                                                <button
                                                    type="button"
                                                    onClick={addCustomPrice}
                                                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Agregar precio personalizado
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Botones de acción */}
                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => router.visit('/medical/medical-services')}
                                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Actualizando...' : 'Actualizar servicio'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default MedicalServicesEdit;