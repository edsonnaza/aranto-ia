<?php

if (!function_exists('format_currency')) {
    /**
     * Format a number as Paraguay Guaraní currency with smart decimal handling
     * 
     * @param float|string|null $amount The amount to format
     * @param bool $forceDecimals Whether to force showing decimals
     * @return string Formatted currency string (e.g., "₲ 3.000.000" or "₲ 3.000.000,50")
     */
    function format_currency($amount, bool $forceDecimals = false): string
    {
        if ($amount === null || $amount === '') {
            return '₲ 0';
        }

        $numericAmount = is_string($amount) ? (float) $amount : $amount;
        
        if (!is_numeric($numericAmount)) {
            return '₲ 0';
        }

        // Check if we should show decimals (smart formatting)
        $hasSignificantDecimals = $numericAmount != floor($numericAmount);
        $shouldShowDecimals = $forceDecimals || $hasSignificantDecimals;

        if ($shouldShowDecimals) {
            // Format with decimals: ₲ 3.000.000,50
            $integerPart = (int) $numericAmount;
            $decimalPart = round(($numericAmount - $integerPart) * 100);
            
            $formattedInteger = number_format($integerPart, 0, '', '.');
            return sprintf('₲ %s,%02d', $formattedInteger, $decimalPart);
        } else {
            // Format without decimals: ₲ 3.000.000
            $formattedInteger = number_format((int) $numericAmount, 0, '', '.');
            return "₲ {$formattedInteger}";
        }
    }
}

if (!function_exists('parse_currency')) {
    /**
     * Parse a currency string back to a numeric value
     * 
     * @param string $currencyString The formatted currency string
     * @return float Numeric value
     */
    function parse_currency(string $currencyString): float
    {
        if (empty($currencyString)) {
            return 0.0;
        }

        // Remove currency symbol and spaces
        $cleanString = str_replace(['₲', ' '], '', $currencyString);
        
        // Replace thousands separators (dots) and decimal separator (comma)
        $cleanString = str_replace('.', '', $cleanString); // Remove thousands separator
        $cleanString = str_replace(',', '.', $cleanString); // Convert decimal separator
        
        return (float) $cleanString;
    }
}

if (!function_exists('currency_input')) {
    /**
     * Format currency for input fields (without symbol, for editing)
     * 
     * @param float|string|null $amount The amount
     * @return string Formatted string suitable for input fields
     */
    function currency_input($amount): string
    {
        if ($amount === null || $amount === '') {
            return '0';
        }

        $numericAmount = is_string($amount) ? (float) $amount : $amount;
        
        if (!is_numeric($numericAmount)) {
            return '0';
        }

        // Check if we have decimals
        $hasDecimals = $numericAmount != floor($numericAmount);
        
        if ($hasDecimals) {
            return number_format($numericAmount, 2, ',', '.');
        } else {
            return number_format((int) $numericAmount, 0, '', '.');
        }
    }
}

if (!function_exists('validate_currency')) {
    /**
     * Validate if a string is a valid currency format
     * 
     * @param string $value The string to validate
     * @return bool Whether the string is valid currency format
     */
    function validate_currency(string $value): bool
    {
        if (empty(trim($value))) {
            return true; // Empty is valid (will be converted to 0)
        }

        // Pattern for Paraguay currency format: 1.234.567,89 or 1234567,89 or 1234567
        $pattern = '/^\d{1,3}(\.?\d{3})*(\,\d{0,2})?$/';
        
        return preg_match($pattern, trim($value)) === 1;
    }
}

if (!function_exists('currency_to_cents')) {
    /**
     * Convert currency amount to cents for database storage
     * 
     * @param float|string $amount The amount
     * @return int Amount in cents
     */
    function currency_to_cents($amount): int
    {
        $numericAmount = is_string($amount) ? parse_currency($amount) : (float) $amount;
        return (int) round($numericAmount * 100);
    }
}

if (!function_exists('cents_to_currency')) {
    /**
     * Convert cents from database to currency amount
     * 
     * @param int $cents The amount in cents
     * @return float Currency amount
     */
    function cents_to_currency(int $cents): float
    {
        return $cents / 100;
    }
}