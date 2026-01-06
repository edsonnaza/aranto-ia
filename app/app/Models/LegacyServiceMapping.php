<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $legacy_product_id
 * @property int $service_id
 * @property string $legacy_name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class LegacyServiceMapping extends Model
{
    protected $table = 'legacy_service_mappings';

    protected $fillable = [
        'legacy_product_id',
        'service_id',
        'legacy_name',
    ];

    /**
     * Get the service associated with this mapping.
     */
    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    /**
     * Find service by legacy product ID.
     */
    public static function findByLegacyId($legacyProductId)
    {
        return static::where('legacy_product_id', $legacyProductId)->first();
    }
}
