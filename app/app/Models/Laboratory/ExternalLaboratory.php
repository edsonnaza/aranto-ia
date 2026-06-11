<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExternalLaboratory extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'contact_name',
        'phone',
        'whatsapp',
        'email',
        'address',
        'notes',
        'status',
    ];

    public function testRequests(): HasMany
    {
        return $this->hasMany(LabTestRequest::class, 'external_laboratory_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
