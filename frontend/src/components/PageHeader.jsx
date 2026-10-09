export default function PageHeader({ title, subtitle, action, back }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
      <div>
        {back && (
          <button
            onClick={back.onClick}
            className="text-sm text-green-700 hover:text-green-800 mb-2 flex items-center gap-1 cursor-pointer transition-colors font-medium"
          >
            ← {back.label}
          </button>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm sm:text-base text-warm-500 mt-1.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 mt-1">{action}</div>}
    </div>
  )
}