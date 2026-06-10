<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LabArea extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'status',
        'display_order',
    ];

    public function profiles(): HasMany
    {
        return $this->hasMany(LabTestProfile::class);
    }

    public function equipments(): HasMany
    {
        return $this->hasMany(LabEquipment::class);
    }
}
