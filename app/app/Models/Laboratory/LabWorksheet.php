<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class LabWorksheet extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'worksheet_number',
        'worksheet_date',
        'lab_equipment_id',
        'technician_id',
        'status',
        'notes',
    ];

    protected $casts = [
        'worksheet_date' => 'date',
    ];

    /**
     * Relación con el equipo
     */
    public function equipment()
    {
        return $this->belongsTo(LabEquipment::class, 'lab_equipment_id');
    }

    /**
     * Relación con el técnico
     */
    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    /**
     * Relación con los items de la worksheet
     */
    public function items()
    {
        return $this->hasMany(LabWorksheetItem::class)->orderBy('position');
    }

    /**
     * Scope para worksheets activas
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['draft', 'in_progress']);
    }

    /**
     * Scope para worksheets de hoy
     */
    public function scopeToday($query)
    {
        return $query->whereDate('worksheet_date', today());
    }
}
