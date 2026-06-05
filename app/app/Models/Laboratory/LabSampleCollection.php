<?php

namespace App\Models\Laboratory;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class LabSampleCollection extends Model
{
    protected $fillable = [
        'lab_sample_id',
        'collected_by',
        'collected_at',
        'sample_type',
        'container_type',
        'volume',
        'volume_unit',
        'sample_condition',
        'collection_site',
        'collection_notes',
    ];

    protected $casts = [
        'collected_at' => 'datetime',
        'volume' => 'decimal:2',
    ];

    public function sample()
    {
        return $this->belongsTo(LabSample::class, 'lab_sample_id');
    }

    public function collectedBy()
    {
        return $this->belongsTo(User::class, 'collected_by');
    }
}
