/**
 * Format a number as percentage with smart decimal handling
 * Only shows decimals if they're not zero
 * 
 * @param percentage The percentage to format
 * @param includeSymbol Whether to include % symbol
 * @returns Formatted percentage (e.g., "70%" or "70.5%")
 */
export function formatPercentage(percentage: number | string | null | undefined, includeSymbol: boolean = true): string {
  if (percentage === null || percentage === undefined || percentage === '') {
    return includeSymbol ? '0%' : '0';
  }

  const numericPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  
  if (!Number.isFinite(numericPercentage)) {
    return includeSymbol ? '0%' : '0';
  }

  // Check if we have significant decimals
  const hasSignificantDecimals = numericPercentage !== Math.floor(numericPercentage);
  
  let formatted: string;
  
  if (hasSignificantDecimals) {
    // Show decimals when they exist, but remove trailing zeros: 70.5%
    formatted = parseFloat(numericPercentage.toFixed(2)).toString();
  } else {
    // Show as integer when no decimals: 70%
    formatted = Math.floor(numericPercentage).toString();
  }

  return includeSymbol ? `${formatted}%` : formatted;
}

/**
 * Format currency for Paraguay Guaraní with smart decimal handling
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '₲ 0';
  }

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (!Number.isFinite(numericAmount)) {
    return '₲ 0';
  }

  // Check if we should show decimals
  const hasSignificantDecimals = numericAmount !== Math.floor(numericAmount);
  
  if (hasSignificantDecimals) {
    // Format with decimals: ₲ 3.000.000,50
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  } else {
    // Format without decimals: ₲ 3.000.000
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericAmount);
  }
}