<?php

namespace App\Traits;

/**
 * Currency Helper Trait
 * 
 * Provides currency formatting methods for Eloquent models
 */
trait HasCurrencyHelpers
{
    /**
     * Get formatted currency for the specified attribute
     * 
     * @param string $attribute The attribute name
     * @param bool $forceDecimals Whether to force showing decimals
     * @return string Formatted currency string
     */
    public function getFormattedAttribute(string $attribute, bool $forceDecimals = false): string
    {
        $value = $this->getAttribute($attribute);
        return format_currency($value, $forceDecimals);
    }

    /**
     * Get currency input format for the specified attribute
     * 
     * @param string $attribute The attribute name
     * @return string Formatted currency for inputs
     */
    public function getInputAttribute(string $attribute): string
    {
        $value = $this->getAttribute($attribute);
        return currency_input($value);
    }

    /**
     * Magic methods for automatic currency formatting
     * Dynamic accessors for formatted values
     */
    public function __get($key)
    {
        // Check if the key ends with '_formatted'
        if (str_ends_with($key, '_formatted')) {
            $baseAttribute = str_replace('_formatted', '', $key);
            if ($this->hasCurrencyAttribute($baseAttribute)) {
                return $this->getFormattedAttribute($baseAttribute);
            }
        }

        // Check if the key ends with '_input'
        if (str_ends_with($key, '_input')) {
            $baseAttribute = str_replace('_input', '', $key);
            if ($this->hasCurrencyAttribute($baseAttribute)) {
                return $this->getInputAttribute($baseAttribute);
            }
        }

        return parent::__get($key);
    }

    /**
     * Check if an attribute exists in the model (renamed to avoid conflict)
     */
    public function hasCurrencyAttribute(string $attribute): bool
    {
        return array_key_exists($attribute, $this->attributes) || 
               in_array($attribute, $this->fillable) ||
               array_key_exists($attribute, $this->casts);
    }

    /**
     * Get all currency attributes for this model
     */
    public function getCurrencyAttributes(): array
    {
        $currencyFields = [];
        
        foreach ($this->casts as $attribute => $cast) {
            if ($cast === \App\Casts\CurrencyCast::class || 
                (is_string($cast) && str_starts_with($cast, 'decimal'))) {
                $currencyFields[] = $attribute;
            }
        }
        
        return $currencyFields;
    }

    /**
     * Get formatted currency data for all currency attributes
     */
    public function getFormattedCurrencyData(): array
    {
        $data = [];
        
        foreach ($this->getCurrencyAttributes() as $attribute) {
            $value = $this->getAttribute($attribute);
            $data[$attribute] = $value;
            $data[$attribute . '_formatted'] = format_currency($value);
            $data[$attribute . '_input'] = currency_input($value);
        }
        
        return $data;
    }
}