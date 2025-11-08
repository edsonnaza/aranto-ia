<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Currency Cast for Eloquent Models
 * 
 * Automatically converts between database storage format and currency values
 * - Database: Stores as DECIMAL(15,2) in base currency units
 * - Application: Works with float values
 * - Frontend: Can be formatted using helpers
 */
class CurrencyCast implements CastsAttributes
{
    /**
     * Cast the given value for storage in the database
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  mixed  $value
     * @param  array  $attributes
     * @return mixed
     */
    public function set(Model $model, string $key, $value, array $attributes)
    {
        if ($value === null || $value === '') {
            return null;
        }

        // If it's already a numeric value, return as-is
        if (is_numeric($value)) {
            return (float) $value;
        }

        // If it's a formatted currency string, parse it
        if (is_string($value)) {
            return parse_currency($value);
        }

        return (float) $value;
    }

    /**
     * Cast the given value for use in the application
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $key
     * @param  mixed  $value
     * @param  array  $attributes
     * @return float
     */
    public function get(Model $model, string $key, $value, array $attributes): float
    {
        return (float) $value;
    }
}