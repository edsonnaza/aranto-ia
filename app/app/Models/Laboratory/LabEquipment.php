<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabEquipment extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'name', 'manufacturer', 'model', 'serial_number', 'status'
    ];

    public function profileEquipments() {
        return $this->hasMany(LabProfileEquipment::class);
    }
    public function parameterRanges() {
        return $this->hasMany(LabEquipmentParameterRange::class);
    }
}