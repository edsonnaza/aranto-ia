<?php

namespace App\Services;

use Carbon\Carbon;

class AuditLogTransformer
{
    /**
     * Mapeo de campos en inglés a español.
     */
    private const FIELD_MAPPING = [
        'id' => 'id',
        'first_name' => 'nombre',
        'last_name' => 'apellido',
        'email' => 'correo',
        'phone' => 'teléfono',
        'gender' => 'género',
        'birth_date' => 'fecha_nacimiento',
        'date_of_birth' => 'fecha_nacimiento',
        'document_type' => 'tipo_documento',
        'document_number' => 'número_documento',
        'address' => 'dirección',
        'city' => 'ciudad',
        'state' => 'estado',
        'postal_code' => 'código_postal',
        'status' => 'estado',
        'notes' => 'notas',
        'insurance_type_id' => 'tipo_seguro_id',
        'insurance_number' => 'número_seguro',
        'insurance_valid_until' => 'seguro_válido_hasta',
        'insurance_coverage_percentage' => 'porcentaje_cobertura',
        'emergency_contact_name' => 'nombre_contacto_emergencia',
        'emergency_contact_phone' => 'teléfono_contacto_emergencia',
        // Profesionales
        'professional_license' => 'matrícula_profesional',
        'license_expiry_date' => 'vencimiento_matrícula',
        'title' => 'título',
        'commission_percentage' => 'porcentaje_comisión',
        'commission_calculation_method' => 'método_cálculo_comisión',
        'hire_date' => 'fecha_contratación',
        'termination_date' => 'fecha_terminación',
        'is_active' => 'activo',
        // Servicios Médicos
        'name' => 'nombre_servicio',
        'code' => 'código_servicio',
        'description' => 'descripción_servicio',
        'category_id' => 'categoría_id',
        'duration_minutes' => 'duración_minutos',
        'requires_appointment' => 'requiere_cita',
        'requires_preparation' => 'requiere_preparación',
        'preparation_instructions' => 'instrucciones_preparación',
        'default_commission_percentage' => 'porcentaje_comisión_defecto',
        // Tesorería / Caja Registradora
        'user_id' => 'usuario_id',
        'opening_date' => 'fecha_apertura',
        'closing_date' => 'fecha_cierre',
        'initial_amount' => 'monto_inicial',
        'final_physical_amount' => 'monto_físico_final',
        'calculated_balance' => 'balance_calculado',
        'total_income' => 'total_ingresos',
        'total_expenses' => 'total_egresos',
        'difference' => 'diferencia',
        'difference_justification' => 'justificación_diferencia',
        'authorized_by' => 'autorizado_por',
        // Transacciones
        'cash_register_session_id' => 'sesión_caja_id',
        'type' => 'tipo_transacción',
        'category' => 'categoría_transacción',
        'amount' => 'monto',
        'concept' => 'concepto',
        'patient_id' => 'paciente_id',
        'professional_id' => 'profesional_id',
        'liquidation_id' => 'liquidación_id',
        'commission_liquidation_id' => 'liquidación_comisión_id',
        'payment_method' => 'método_pago',
        'original_transaction_id' => 'transacción_original_id',
        'cancellation_reason' => 'razón_cancelación',
        'cancelled_by' => 'cancelado_por',
        'cancelled_at' => 'fecha_cancelación',
        'metadata' => 'metadatos',
        'service_id' => 'servicio_id',
        'service_request_id' => 'solicitud_servicio_id',
        // Detalles de Solicitudes de Servicio
        'medical_service_id' => 'servicio_médico_id',
        'scheduled_date' => 'fecha_programada',
        'scheduled_time' => 'hora_programada',
        'estimated_duration' => 'duración_estimada',
        'unit_price' => 'precio_unitario',
        'quantity' => 'cantidad',
        'subtotal' => 'subtotal',
        'discount_percentage' => 'porcentaje_descuento',
        'discount_amount' => 'monto_descuento',
        'total_amount' => 'monto_total',
        'movement_detail_id' => 'detalle_movimiento_id',
        'paid_at' => 'fecha_pago',
        // Comisiones
      
        'period_start' => 'fecha_inicio_período',
        'period_end' => 'fecha_fin_período',
        'total_services' => 'total_servicios',
        'gross_amount' => 'monto_bruto',
        'commission_amount' => 'monto_comisión',
        'generated_by' => 'generado_por',
        'approved_by' => 'aprobado_por',
        'payment_movement_id' => 'movimiento_pago_id',
        'service_date' => 'fecha_servicio',
        'payment_date' => 'fecha_pago_servicio',
        'service_amount' => 'monto_servicio',
        'created_at' => 'creado_en',
        'updated_at' => 'actualizado_en',
    ];

    /**
     * Mapeo de valores en inglés a español.
     */
    private const VALUE_MAPPING = [
        'gender' => [
            'M' => 'Masculino',
            'F' => 'Femenino',
            'OTHER' => 'Otro',
            'male' => 'Masculino',
            'female' => 'Femenino',
            'other' => 'Otro',
        ],
        'status' => [
            'active' => 'Activo',
            'inactive' => 'Inactivo',
            'deleted' => 'Eliminado',
            'pending' => 'Pendiente',
            'pending_confirmation' => 'Confirmación Pendiente',
            'confirmed' => 'Confirmado',
            'in_progress' => 'En Progreso',
            'completed' => 'Completado',
            'suspended' => 'Suspendido',
            'terminated' => 'Terminado',
            'open' => 'Abierto',
            'closed' => 'Cerrado',
            'cancelled' => 'Cancelado',
            'draft' => 'Borrador',
            'approved' => 'Aprobado',
            'paid' => 'Pagado',
        ],
        'document_type' => [
            'CI' => 'Cédula de Identidad',
            'RUC' => 'RUC',
            'PASSPORT' => 'Pasaporte',
            'OTHER' => 'Otro',
        ],
        'commission_calculation_method' => [
            'percentage' => 'Porcentaje',
            'fixed_amount' => 'Monto Fijo',
            'custom' => 'Personalizado',
            'tiered' => 'Escalonado',
        ],
        'is_active' => [
            '1' => 'Sí',
            '0' => 'No',
            true => 'Sí',
            false => 'No',
        ],
        'requires_appointment' => [
            '1' => 'Sí',
            '0' => 'No',
            true => 'Sí',
            false => 'No',
        ],
        'requires_preparation' => [
            '1' => 'Sí',
            '0' => 'No',
            true => 'Sí',
            false => 'No',
        ],
        'type' => [
            'INCOME' => 'Ingreso',
            'EXPENSE' => 'Egreso',
            'PAYMENT' => 'Pago',
        ],
        'category' => [
            'SERVICE_PAYMENT' => 'Pago de Servicio',
            'SUPPLIER_PAYMENT' => 'Pago a Proveedor',
            'COMMISSION_LIQUIDATION' => 'Liquidación de Comisión',
            'CASH_DIFFERENCE' => 'Diferencia de Caja',
            'OTHER' => 'Otro',
        ],
        'payment_method' => [
            'CASH' => 'Efectivo',
            'CREDIT_CARD' => 'Tarjeta de Crédito',
            'DEBIT_CARD' => 'Tarjeta de Débito',
            'TRANSFER' => 'Transferencia',
            'CHECK' => 'Cheque',
            'DIGITAL' => 'Digital',
            'OTHER' => 'Otro',
        ],
    ];

    /**
     * Transformar datos de auditoría (valores antiguos o nuevos) al español.
     *
     * @param array $data
     * @return array
     */
    public function transform(array $data): array
    {
        $transformed = [];

        foreach ($data as $key => $value) {
            $newKey = self::FIELD_MAPPING[$key] ?? $key;
            $newValue = $this->transformValue($key, $value);
            $transformed[$newKey] = $newValue;
        }

        return $transformed;
    }

    /**
     * Transformar el valor de un campo específico.
     *
     * @param string $field
     * @param mixed $value
     * @return mixed
     */
    private function transformValue(string $field, mixed $value): mixed
    {
        // Si el valor es null, mantenerlo
        if ($value === null) {
            return null;
        }

        // Transformar fechas
        if (in_array($field, ['birth_date', 'date_of_birth', 'created_at', 'updated_at', 'insurance_valid_until', 'license_expiry_date', 'hire_date', 'termination_date', 'opening_date', 'closing_date', 'cancelled_at', 'scheduled_date', 'paid_at', 'period_start', 'period_end', 'service_date', 'payment_date'])) {
            return $this->formatDate($value);
        }

        // Transformar valores mapeados
        if (isset(self::VALUE_MAPPING[$field]) && isset(self::VALUE_MAPPING[$field][$value])) {
            return self::VALUE_MAPPING[$field][$value];
        }

        return $value;
    }

    /**
     * Formatear fecha a formato legible en español.
     *
     * @param mixed $date
     * @return string
     */
    private function formatDate(mixed $date): string
    {
        if (!$date) {
            return '';
        }

        try {
            $carbon = $date instanceof Carbon ? $date : Carbon::parse($date);
            return $carbon->format('d/m/Y H:i');
        } catch (\Exception $e) {
            return (string) $date;
        }
    }

    /**
     * Obtener los nombres de campos en español.
     *
     * @return array
     */
    public static function getFieldNames(): array
    {
        return self::FIELD_MAPPING;
    }
}
