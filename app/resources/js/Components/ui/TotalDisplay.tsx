interface TotalDisplayProps {
  total: number
  subtotal?: number
  discount?: number
  currency?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'text-2xl px-4 py-3',
  md: 'text-3xl px-5 py-4',
  lg: 'text-4xl px-6 py-5',
  xl: 'text-5xl px-8 py-6'
}

export default function TotalDisplay({ 
  total, 
  subtotal,
  discount,
  currency = '₲', 
  className = '',
  size = 'lg' 
}: TotalDisplayProps) {
  const formatTotal = (amount: number) => {
    // Ensure amount is a valid number, default to 0 if NaN
    const validAmount = isNaN(amount) ? 0 : amount
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(validAmount)
  }

  // Show detailed breakdown if subtotal and discount are provided
  if (subtotal !== undefined && discount !== undefined) {
    return (
      <div className={`relative ${className}`}>
        {/* Total Green LED Section */}
        <div className={`
          bg-linear-to-br from-slate-50 to-slate-100
          border border-slate-200
          rounded-2xl shadow-lg 
          transform transition-all duration-300 hover:shadow-xl
          overflow-hidden mb-4
        `}>
          {/* Subtle top accent */}
          <div className="h-1 bg-linear-to-r from-emerald-400 to-teal-500"></div>
          
          {/* Main content area */}
          <div className={`
            bg-white/80 backdrop-blur-sm
            ${sizeClasses['lg']}
            text-center
          `}>
            {/* Currency and amount */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Total a Pagar
              </div>
              <div className={`
                font-mono font-bold 
                text-slate-800
                tracking-tight
                leading-none
              `}>
                <span className="text-emerald-600 text-2xl">{currency}</span>{' '}
                <span className="text-slate-800">{formatTotal(total)}</span>
              </div>
            </div>
          </div>
          
          {/* Subtle bottom border */}
          <div className="h-0.5 bg-linear-to-r from-transparent via-slate-200 to-transparent"></div>
        </div>

        {/* Details Section Below */}
        <div className={`
          bg-white
          border border-gray-200
          rounded-lg shadow-sm p-4
          space-y-2
        `}>
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium text-gray-900">{currency} {formatTotal(subtotal)}</span>
          </div>
          
          {/* Discount */}
        
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
              <span className="text-red-600 font-medium">Descuento:</span>
              <span className="font-medium text-red-600">-{currency} {formatTotal(discount)}</span>
            </div>
 
        </div>
      </div>
    )
  }

  // Original simple display
  return (
    <div className={`relative ${className}`}>
      {/* Modern Minimal Display Container */}
      <div className={`
        bg-linear-to-br from-slate-50 to-slate-100
        border border-slate-200
        rounded-2xl shadow-lg 
        transform transition-all duration-300 hover:shadow-xl
        overflow-hidden
      `}>
        {/* Subtle top accent */}
        <div className="h-1 bg-linear-to-r from-emerald-400 to-teal-500"></div>
        
        {/* Main content area */}
        <div className={`
          bg-white/80 backdrop-blur-sm
          ${sizeClasses[size]}
          text-center
        `}>
          {/* Currency and amount */}
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Total
            </div>
            <div className={`
              font-mono font-bold 
              text-slate-800
              tracking-tight
              leading-none
            `}>
              <span className="text-emerald-600">{currency}</span>{' '}
              <span className="text-slate-800">{formatTotal(total)}</span>
            </div>
          </div>
        </div>
        
        {/* Subtle bottom border */}
        <div className="h-0.5 bg-linear-to-r from-transparent via-slate-200 to-transparent"></div>
        
        {/* Subtle glass reflection */}
        <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-transparent 
                       rounded-2xl pointer-events-none">
        </div>
      </div>
    </div>
  )}