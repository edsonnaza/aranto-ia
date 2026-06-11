<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Professional;
use App\Models\User;

class LabValidation extends Model
{
    use SoftDeletes;
    
    protected $fillable = [
        'lab_sample_id',
        'lab_test_request_id',
        'validated_by',
        'validated_by_professional_id',
        'validated_at',
        'comments'
    ];

    protected $casts = [
        'validated_at' => 'datetime',
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
     * Relación con el usuario que validó
     */
    public function validatedBy()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function validatedProfessional()
    {
        return $this->belongsTo(Professional::class, 'validated_by_professional_id');
    }
}
