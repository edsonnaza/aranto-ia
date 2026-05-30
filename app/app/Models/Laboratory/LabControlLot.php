<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabControlLot extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'lot_number', 'expiration_date', 'equipment_id'
    ];

    public function equipment() {
        return $this->belongsTo(LabEquipment::class, 'equipment_id');
    }
    public function controlTests() {
        return $this->hasMany(LabControlTest::class);
    }
}