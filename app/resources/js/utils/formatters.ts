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
/**
 * Get status badge config for service request status
 */
export function getStatusBadgeConfig(status: string): { label: string; className: string } {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending_confirmation: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'En Proceso', className: 'bg-orange-100 text-orange-800' },
    pending_payment: { label: 'Pend. Pago', className: 'bg-purple-100 text-purple-800' },
    paid: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' }
  }
  
  return statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
}

/**
 * Get payment status badge config
 */
export function getPaymentStatusBadgeConfig(status: string): { label: string; className: string; variant: 'pending' | 'secondary' | 'paid' | 'destructive' | 'outline' } {
  const statusConfig: Record<string, { label: string; className: string; variant: 'pending' | 'secondary' | 'paid' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pendiente', className: 'bg-red-50 text-red-700', variant: 'pending' },
    partial: { label: 'Parcial', className: 'bg-yellow-50 text-yellow-700', variant: 'secondary' },
    paid: { label: 'Pagado', className: 'bg-green-50 text-green-700', variant: 'paid' },
  }
  
  return statusConfig[status] || { label: status, className: 'bg-gray-50 text-gray-700', variant: 'outline' }
}

/**
 * Get reception type badge config
 */
export function getReceptionTypeBadgeConfig(type: string): { label: string; className: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'paid' | 'pending' | 'cancelled' } {
  const typeConfig: Record<string, { label: string; className: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'paid' | 'pending' | 'cancelled' }> = {
    scheduled: { label: 'Agendado', className: 'bg-blue-100 text-blue-800', variant: 'default' },
    walk_in: { label: 'Sin Agenda', className: 'bg-green-100 text-green-800', variant: 'secondary' },
    emergency: { label: 'Emergencia', className: 'bg-red-100 text-red-800', variant: 'destructive' },
    inpatient_discharge: { label: 'Alta Hospitalaria', className: 'bg-purple-100 text-purple-800', variant: 'outline' }
  }
  
  return typeConfig[type] || { label: type, className: 'bg-gray-100 text-gray-800', variant: 'outline' }
}

/**
 * Get payment method label in Spanish
 */
export function getPaymentMethodLabel(method: string): string {
  const methodConfig: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    check: 'Cheque',
    transfer: 'Transferencia',
    deposit: 'Depósito',
    credit: 'Crédito',
    other: 'Otro'
  }
  
  return methodConfig[method.toLowerCase()] || method
}