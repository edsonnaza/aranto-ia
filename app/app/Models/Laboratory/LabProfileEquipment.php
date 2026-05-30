<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabProfileEquipment extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'lab_test_profile_id', 'lab_equipment_id', 'is_default'
    ];

    public function profile() {
        return $this->belongsTo(LabTestProfile::class, 'lab_test_profile_id');
    }
    public function equipment() {
        return $this->belongsTo(LabEquipment::class, 'lab_equipment_id');
    }
}