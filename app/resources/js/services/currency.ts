/**
 * Currency Service - Paraguay Guaraní Formatting
 * 
 * Provides utilities for formatting monetary values according to
 * Paraguay's currency standards (Guaraní - ₲)
 * 
 * Format: ₲ 3.120.000,00
 * - Symbol: ₲ (before amount)
 * - Thousands separator: . (dot)
 * - Decimal separator: , (comma)
 * - Decimal places: 2
 */

export interface CurrencyConfig {
    code: string;
    name: string;
    symbol: string;
    symbolPosition: 'before' | 'after';
    decimalPlaces: number;
    decimalSeparator: string;
    thousandsSeparator: string;
    format: string;
}

// Paraguay currency configuration
export const CURRENCY_CONFIG: CurrencyConfig = {
    code: 'PYG',
    name: 'Paraguayan Guaraní',
    symbol: '₲',
    symbolPosition: 'before',
    decimalPlaces: 2,
    decimalSeparator: ',',
    thousandsSeparator: '.',
    format: '₲ {amount}',
};

/**
 * Format a number as Paraguay Guaraní currency with smart decimal handling
 * @param amount - The numeric amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "₲ 3.000.000" or "₲ 3.000.000,50")
 */
export function formatCurrency(
    amount: number | string,
    options?: Partial<CurrencyConfig & { forceDecimals?: boolean }>
): string {
    const config = { ...CURRENCY_CONFIG, ...options };
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) {
        return config.format.replace('{amount}', '0');
    }

    // Check if we should show decimals (smart formatting)
    const hasSignificantDecimals = numericAmount % 1 !== 0;
    const shouldShowDecimals = options?.forceDecimals || hasSignificantDecimals;
    
    // Format with appropriate decimal places
    const decimalPlaces = shouldShowDecimals ? config.decimalPlaces : 0;
    const fixedAmount = numericAmount.toFixed(decimalPlaces);
    
    if (shouldShowDecimals) {
        const [integerPart, decimalPart] = fixedAmount.split('.');
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
        const formattedAmount = formattedInteger + config.decimalSeparator + decimalPart;
        return config.format.replace('{amount}', formattedAmount);
    } else {
        // No decimals - just format the integer part
        const formattedInteger = Math.floor(numericAmount).toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
        return config.format.replace('{amount}', formattedInteger);
    }
}

/**
 * Parse a currency string back to a number
 * @param currencyString - The formatted currency string
 * @returns Numeric value
 */
export function parseCurrency(currencyString: string): number {
    if (!currencyString) return 0;
    
    // Remove currency symbol and spaces
    let cleanString = currencyString.replace(CURRENCY_CONFIG.symbol, '').trim();
    
    // Replace thousands separators and decimal separator
    cleanString = cleanString
        .replace(new RegExp('\\' + CURRENCY_CONFIG.thousandsSeparator, 'g'), '')
        .replace(CURRENCY_CONFIG.decimalSeparator, '.');
    
    return parseFloat(cleanString) || 0;
}

/**
 * Format currency for input fields (without symbol, for editing)
 * @param amount - The numeric amount
 * @returns Formatted string suitable for input fields
 */
export function formatCurrencyInput(amount: number | string): string {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) {
        return '0';
    }

    return numericAmount.toLocaleString('es-PY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).replace(/[.,]/g, (match) => {
        return match === ',' ? '.' : ',';
    });
}

/**
 * Validate if a string is a valid currency format
 * @param value - The string to validate
 * @returns boolean indicating if it's valid
 */
export function isValidCurrencyInput(value: string): boolean {
    if (!value || value.trim() === '') return true;
    
    // Allow numbers with optional thousands separators and decimal part
    const pattern = new RegExp(
        `^\\d{1,3}(\\${CURRENCY_CONFIG.thousandsSeparator}\\d{3})*(\\${CURRENCY_CONFIG.decimalSeparator}\\d{0,${CURRENCY_CONFIG.decimalPlaces}})?$`
    );
    
    return pattern.test(value.trim());
}

/**
 * Convert amount between different currency representations
 */
export const CurrencyConverter = {
    /**
     * Convert from cents to main currency unit
     */
    fromCents(cents: number): number {
        return cents / Math.pow(10, CURRENCY_CONFIG.decimalPlaces);
    },

    /**
     * Convert from main currency unit to cents
     */
    toCents(amount: number): number {
        return Math.round(amount * Math.pow(10, CURRENCY_CONFIG.decimalPlaces));
    },
};

// Export common formatting functions with shorter names
export const formatPYG = formatCurrency;
export const parsePYG = parseCurrency;

// Default export
export default {
    formatCurrency,
    parseCurrency,
    formatCurrencyInput,
    isValidCurrencyInput,
    CurrencyConverter,
    CURRENCY_CONFIG,
    formatPYG,
    parsePYG,
};