export default function Card({ children, className = '', padding = true, hover = false, bordered = true }) {
  return (
    <div
      className={`
        bg-white rounded-2xl transition-all duration-300
        ${bordered ? 'border border-warm-200' : ''}
        ${padding ? 'p-5 sm:p-6' : ''}
        ${hover ? 'hover:border-green-200 hover:shadow-lg' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 pb-3 border-b border-warm-200 ${className}`}>
      <div>
        <h2 className="text-sm sm:text-base font-bold text-warm-900">{title}</h2>
        {subtitle && <p className="text-xs mt-0.5 text-warm-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}