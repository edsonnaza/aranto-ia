<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Patient;
use App\Models\User;

class LabSample extends Model
{
    use SoftDeletes;
    
    protected $fillable = [
        'service_request_detail_id',
        'patient_id',
        'sample_number',
        'barcode',
        'lab_sample_type_id',
        'collected_at',
        'received_at',
        'received_by',
        'status',
        'remarks'
    ];

    protected $casts = [
        'collected_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    /**
     * Relación con service request detail
     */
    public function serviceRequestDetail()
    {
        return $this->belongsTo(\App\Models\ServiceRequestDetail::class);
    }

    /**
     * Relación con paciente
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Relación con tipo de muestra
     */
    public function sampleType()
    {
        return $this->belongsTo(LabSampleType::class, 'lab_sample_type_id');
    }

    /**
     * Relación con usuario que recibió la muestra
     */
    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /**
     * Relación con solicitudes de pruebas
     */
    public function testRequests()
    {
        return $this->hasMany(LabTestRequest::class);
    }

    /**
     * Relación con resultados (a través de test requests)
     */
    public function results()
    {
        return $this->hasMany(LabResult::class);
    }

    /**
     * Relación con validación
     */
    public function validation()
    {
        return $this->hasOne(LabValidation::class);
    }

    /**
     * Relación con reporte
     */
    public function report()
    {
        return $this->hasOne(LabReport::class);
    }
}