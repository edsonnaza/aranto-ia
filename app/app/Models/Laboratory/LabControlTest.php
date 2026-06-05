<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabControlTest extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'equipment_id', 'performed_by', 'performed_at'
    ];

    public function equipment() {
        return $this->belongsTo(LabEquipment::class, 'equipment_id');
    }
    public function performedBy() {
        return $this->belongsTo(\App\Models\User::class, 'performed_by');
    }
    public function controlResults() {
        return $this->hasMany(LabControlResult::class);
    }
}