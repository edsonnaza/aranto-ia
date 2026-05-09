<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
/**
 * @property int $id
 * @property string $name
 * @property string|null $ruc
 * @property string|null $logo_path
 * @property string|null $legal_representative
 * @property string|null $phone
 * @property string|null $email
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class CompanySetting extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'ruc',
        'logo_path',
        'legal_representative',
        'phone',
        'email',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the active company setting record.
     */
    public static function current(): ?self
    {
        if (! Schema::hasTable('company_settings')) {
            return null;
        }

        return static::query()->first();
    }

    /**
     * Get the public URL for the company logo.
     */
    public function getLogoUrlAttribute(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }

        return asset('storage/' . ltrim($this->logo_path, '/'));
    }
}