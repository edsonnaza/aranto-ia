<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Patient;
use App\Models\User;
use App\Models\Laboratory\LabSampleType;
use App\Models\Laboratory\LabTestRequest;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabValidation;
use App\Models\Laboratory\LabReport;
use App\Models\Laboratory\LabSampleCollection;

/**
 * @property int $id
 * @property int|null $service_request_detail_id
 * @property int $patient_id
 * @property string $sample_number
 * @property string|null $barcode
 * @property int|null $lab_sample_type_id
 * @property \Illuminate\Support\Carbon|null $collected_at
 * @property int|null $collected_by
 * @property \Illuminate\Support\Carbon|null $received_at
 * @property int|null $received_by
 * @property string $status
 * @property string|null $remarks
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
        'collected_by',
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
    public function serviceRequestDetail(): BelongsTo
    {
        return $this->belongsTo(\App\Models\ServiceRequestDetail::class);
    }

    /**
     * Relación con paciente
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Relación con tipo de muestra
     */
    public function sampleType(): BelongsTo
    {
        return $this->belongsTo(LabSampleType::class, 'lab_sample_type_id');
    }

    /**
     * Relación con usuario que recibió la muestra
     */
    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function collectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collected_by');
    }

    /**
     * Relación con solicitudes de pruebas
     */
    public function testRequests(): HasMany
    {
        return $this->hasMany(LabTestRequest::class);
    }

    /**
     * Relación con resultados (a través de test requests)
     */
    public function results(): HasMany
    {
        return $this->hasMany(LabResult::class);
    }

    /**
     * Relación con validación
     */
    public function validation(): HasOne
    {
        return $this->hasOne(LabValidation::class);
    }

    /**
     * Relación con reporte
     */
    public function report(): HasOne
    {
        return $this->hasOne(LabReport::class);
    }

    public function collections(): HasMany
    {
        return $this->hasMany(LabSampleCollection::class);
    }

    public function latestCollection(): HasOne
    {
        return $this->hasOne(LabSampleCollection::class)->latestOfMany('collected_at');
    }
}