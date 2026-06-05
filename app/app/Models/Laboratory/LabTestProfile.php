<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $medical_service_id
 * @property string $name
 * @property string $code
 * @property string|null $description
 * @property string $status
 * @property string|null $validation_type
 * @property float|null $validation_target
 * @property float|null $validation_tolerance
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class LabTestProfile extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'medical_service_id',
        'name',
        'code',
        'description',
        'status',
        'validation_type',
        'validation_target',
        'validation_tolerance',
    ];

    protected $casts = [
        'validation_target' => 'decimal:2',
        'validation_tolerance' => 'decimal:2',
    ];

    public function parameters(): HasMany {
        return $this->hasMany(LabTestParameter::class);
    }
    public function medicalService(): BelongsTo {
        return $this->belongsTo(\App\Models\MedicalService::class);
    }
    public function profileEquipments(): HasMany {
        return $this->hasMany(LabProfileEquipment::class);
    }
}