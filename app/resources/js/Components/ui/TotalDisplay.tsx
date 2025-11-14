interface TotalDisplayProps {
  total: number
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
  currency = '₲', 
  className = '',
  size = 'lg' 
}: TotalDisplayProps) {
  const formatTotal = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

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
        
        {/* Modern status indicator */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="text-xs text-slate-400 font-medium">ACTIVO</div>
          </div>
        </div>
        
        {/* Subtle glass reflection */}
        <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-transparent 
                       rounded-2xl pointer-events-none">
        </div>
      </div>
    </div>
  )
}