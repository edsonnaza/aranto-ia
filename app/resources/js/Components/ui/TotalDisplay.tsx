interface TotalDisplayProps {
  total: number
  currency?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'text-2xl px-4 py-3',
  md: 'text-3xl px-6 py-4',
  lg: 'text-4xl px-8 py-6',
  xl: 'text-5xl px-10 py-8'
}

const borderClasses = {
  sm: 'border-4',
  md: 'border-4',
  lg: 'border-6',
  xl: 'border-8'
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
      {/* LED Display Container */}
      <div className={`
        bg-black rounded-lg shadow-2xl 
        ${borderClasses[size]} border-gray-700
        transform transition-all duration-300 hover:scale-105
      `}>
        {/* Inner LED Screen */}
        <div className={`
          bg-gradient-to-br from-gray-900 to-black 
          rounded-md p-1 
          shadow-inner
        `}>
          {/* LED Text Display */}
          <div className={`
            bg-black rounded 
            font-mono font-bold text-center
            text-green-400 
            ${sizeClasses[size]}
            tracking-widest
            shadow-lg
            border-2 border-green-900/50
          `}
          style={{
            textShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor, 0 0 20px #00ff00, 0 0 25px #00ff00'
          }}>
            <div className="relative">
              {/* Glow effect background */}
              <div className="absolute inset-0 text-green-400 blur-sm opacity-50">
                {currency} {formatTotal(total)}
              </div>
              
              {/* Main text */}
              <div className="relative z-10">
                {currency} {formatTotal(total)}
              </div>
              
              {/* Scan line effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/10 to-transparent 
                             animate-pulse opacity-30">
              </div>
            </div>
          </div>
        </div>
        
        {/* LED indicator lights */}
        <div className="absolute top-2 right-2 flex space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse opacity-60"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse opacity-80" 
               style={{ animationDelay: '75ms' }}></div>
        </div>
        
        {/* Screen reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent 
                       rounded-lg pointer-events-none">
        </div>
      </div>
      
      {/* Label */}
      <div className="text-center mt-3">
        <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">
          Total General
        </span>
      </div>
    </div>
  )
}