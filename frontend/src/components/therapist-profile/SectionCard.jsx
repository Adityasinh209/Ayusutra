import Card from '../Card.jsx'

export default function SectionCard({ icon: Icon, step, title, subtitle, children, action }) {
  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-warm-200 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green-200 bg-green-50 text-green-700">
            {Icon ? <Icon className="h-5 w-5" /> : <span className="text-sm font-bold">{step}</span>}
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-green-700">Section {step}</p>
            <h2 className="text-base font-bold text-warm-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-warm-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}
