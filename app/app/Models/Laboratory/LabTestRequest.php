<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class LabTestRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'lab_sample_id',
        'lab_test_profile_id',
        'requested_by',
        'priority',
        'status',
        'assigned_to',
        'started_at',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Relación con la muestra
     */
    public function sample()
    {
        return $this->belongsTo(LabSample::class, 'lab_sample_id');
    }

    /**
     * Relación con el perfil de prueba
     */
    public function testProfile()
    {
        return $this->belongsTo(LabTestProfile::class, 'lab_test_profile_id');
    }

    /**
     * Relación con el usuario solicitante
     */
    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Relación con el técnico asignado
     */
    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Relación con los resultados
     */
    public function results()
    {
        return $this->hasMany(LabResult::class);
    }

    /**
     * Relación con las validaciones
     */
    public function validations()
    {
        return $this->hasMany(LabValidation::class);
    }

    /**
     * Relación con items de worksheet
     */
    public function worksheetItems()
    {
        return $this->hasMany(LabWorksheetItem::class);
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
