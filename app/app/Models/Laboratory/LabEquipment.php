<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabEquipment extends Model
{
    use SoftDeletes;

    protected $table = 'lab_equipments';

    protected $fillable = [
        'name',
        'code',
        'manufacturer',
        'model',
        'serial_number',
        'department',
        'lab_area_id',
        'status',
        'notes',
    ];

    public function profileEquipments(): HasMany
    {
        return $this->hasMany(LabProfileEquipment::class);
    }

    public function parameterRanges(): HasMany
    {
        return $this->hasMany(LabEquipmentParameterRange::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(LabArea::class, 'lab_area_id');
    }
}
