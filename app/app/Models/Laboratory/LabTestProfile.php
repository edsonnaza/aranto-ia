<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabTestProfile extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'medical_service_id', 'name', 'code', 'description', 'status'
    ];

    public function parameters() {
        return $this->hasMany(LabTestParameter::class);
    }
    public function medicalService() {
        return $this->belongsTo(\App\Models\MedicalService::class);
    }
    public function profileEquipments() {
        return $this->hasMany(LabProfileEquipment::class);
    }
}