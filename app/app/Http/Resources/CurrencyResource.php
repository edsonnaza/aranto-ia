<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Currency Resource for automatic formatting
 * 
 * Automatically formats currency fields in API responses
 */
class CurrencyResource extends JsonResource
{
    /**
     * Currency fields to format automatically
     */
    protected array $currencyFields = [
        'amount',
        'initial_amount', 
        'final_physical_amount',
        'calculated_balance',
        'total_income',
        'total_expenses',
        'difference',
        'opening_amount',
        'closing_amount',
    ];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);
        
        // Auto-format currency fields
        foreach ($this->currencyFields as $field) {
            if (isset($data[$field]) && $data[$field] !== null) {
                $data[$field . '_formatted'] = format_currency($data[$field]);
                $data[$field . '_input'] = currency_input($data[$field]);
            }
        }

        return $data;
    }
}