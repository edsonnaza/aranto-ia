<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabResult extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'lab_sample_id', 'lab_test_parameter_id', 'equipment_id', 'value', 'calculated_percentage', 'is_out_of_range', 'status', 'entered_by'
    ];

    public function sample() {
        return $this->belongsTo(LabSample::class, 'lab_sample_id');
    }
    public function parameter() {
        return $this->belongsTo(LabTestParameter::class, 'lab_test_parameter_id');
    }
    public function equipment() {
        return $this->belongsTo(LabEquipment::class, 'equipment_id');
    }
    public function enteredBy() {
        return $this->belongsTo(\App\Models\User::class, 'entered_by');
    }
}