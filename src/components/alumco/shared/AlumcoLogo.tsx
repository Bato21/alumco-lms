interface AlumcoLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function AlumcoLogo({ className = '', size = 'md', showText = true }: AlumcoLogoProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  }

  const textSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Geometric Diamond Icon */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <path d="M50 5 L95 50 L50 95 L5 50 Z" fill="none" />
          <path d="M50 5 L95 50 L50 50 Z" fill="#9e3f4e" />
          {/* Red section */}
          <path d="M95 50 L50 95 L50 50 Z" fill="#4059aa" />
          {/* Blue section */}
          <path d="M50 95 L5 50 L50 50 Z" fill="#eab308" />
          {/* Yellow section */}
          <path d="M5 50 L50 5 L50 50 Z" fill="#166534" />
          {/* Green section */}
        </svg>
      </div>
      {showText && (
        <h1 className={`${textSizes[size]} font-extrabold tracking-tighter text-[#2B4FA0]`}>
          alumco
        </h1>
      )}
    </div>
  )
}
