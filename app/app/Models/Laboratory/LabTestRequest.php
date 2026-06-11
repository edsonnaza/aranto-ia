<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;
use App\Models\Laboratory\LabWorksheetItem;
use App\Models\Laboratory\LabTestRequestAttachment;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LabTestRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'lab_sample_id',
        'lab_test_profile_id',
        'requested_by',
        'priority',
        'status',
        'processing_mode',
        'external_laboratory_id',
        'external_reference_number',
        'sent_to_external_at',
        'expected_result_at',
        'external_result_received_at',
        'not_performed_at',
        'not_performed_reason',
        'processing_notes',
        'include_external_attachments_in_medical_history',
        'external_report_path',
        'assigned_to_user_id',
        'started_at',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'sent_to_external_at' => 'datetime',
        'expected_result_at' => 'datetime',
        'external_result_received_at' => 'datetime',
        'not_performed_at' => 'datetime',
        'include_external_attachments_in_medical_history' => 'boolean',
    ];

    /**
     * Relación con la muestra
     */
    public function sample(): BelongsTo
    {
        return $this->belongsTo(LabSample::class, 'lab_sample_id');
    }

    /**
     * Relación con el perfil de prueba
     */
    public function testProfile(): BelongsTo
    {
        return $this->belongsTo(LabTestProfile::class, 'lab_test_profile_id');
    }

    /**
     * Relación con el usuario solicitante
     */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Relación con el técnico asignado
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function externalLaboratory(): BelongsTo
    {
        return $this->belongsTo(ExternalLaboratory::class, 'external_laboratory_id');
    }

    /**
     * Relación con los resultados
     */
    public function results(): HasMany
    {
        return $this->hasMany(LabResult::class);
    }

    /**
     * Relación con las validaciones
     */
    public function validations(): HasMany
    {
        return $this->hasMany(LabValidation::class);
    }

    /**
     * Relación con items de worksheet
     */
    public function worksheetItems(): HasMany
    {
        return $this->hasMany(LabWorksheetItem::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(LabTestRequestAttachment::class)->orderByDesc('id');
    }

    /**
     * Scope para solicitudes pendientes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope para solicitudes en proceso
     */
    public function scopeInProcess($query)
    {
        return $query->where('status', 'in_process');
    }

    /**
     * Scope para solicitudes urgentes
     */
    public function scopeUrgent($query)
    {
        return $query->whereIn('priority', ['urgent', 'stat']);
    }
}
