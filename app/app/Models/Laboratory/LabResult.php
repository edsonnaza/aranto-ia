<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class LabResult extends Model
{
    use SoftDeletes;
    
    protected $fillable = [
        'lab_sample_id',
        'lab_test_request_id',
        'lab_test_parameter_id',
        'equipment_id',
        'value',
        'calculated_percentage',
        'is_out_of_range',
        'status',
        'entered_by'
    ];

    protected $casts = [
        'calculated_percentage' => 'decimal:2',
        'is_out_of_range' => 'boolean',
    ];

    /**
     * Relación con la muestra
     */
    public function sample()
    {
        return $this->belongsTo(LabSample::class, 'lab_sample_id');
    }

    /**
     * Relación con la solicitud de prueba
     */
    public function testRequest()
    {
        return $this->belongsTo(LabTestRequest::class, 'lab_test_request_id');
    }

    /**
     * Relación con el parámetro
     */
    public function parameter()
    {
        return $this->belongsTo(LabTestParameter::class, 'lab_test_parameter_id');
    }

    /**
     * Relación con el equipo
     */
    public function equipment()
    {
        return $this->belongsTo(LabEquipment::class, 'equipment_id');
    }

    /**
     * Relación con el usuario que ingresó el resultado
     */
    public function enteredBy()
    {
        return $this->belongsTo(User::class, 'entered_by');
    }
}