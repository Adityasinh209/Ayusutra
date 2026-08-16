export default function PageHeader({ title, subtitle, action, back }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {back && (
          <button
            onClick={back.onClick}
            className="text-sm text-green-600 hover:text-green-700 mb-1 flex items-center gap-1 cursor-pointer"
          >
            ← {back.label}
          </button>
        )}
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 mt-1">{action}</div>}
    </div>
  )
}
