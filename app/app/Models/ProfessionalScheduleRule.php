<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfessionalScheduleRule extends Model
{
    use Auditable;

    protected $fillable = [
        'professional_schedule_id',
        'weekday',
        'start_time',
        'end_time',
        'capacity',
        'is_active',
    ];

    protected $casts = [
        'weekday' => 'integer',
        'capacity' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(\App\Models\ProfessionalSchedule::class, 'professional_schedule_id');
    }
}