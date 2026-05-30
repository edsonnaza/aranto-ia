<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabEquipmentParameterRange extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'lab_equipment_id', 'lab_test_parameter_id', 'min_value', 'max_value', 'expected_value'
    ];

    public function equipment() {
        return $this->belongsTo(LabEquipment::class, 'lab_equipment_id');
    }
    public function parameter() {
        return $this->belongsTo(LabTestParameter::class, 'lab_test_parameter_id');
    }
}