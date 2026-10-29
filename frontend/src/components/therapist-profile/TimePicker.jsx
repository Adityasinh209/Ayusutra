import { Clock } from 'lucide-react'

export default function TimePicker({ value, onChange, disabled, error }) {
  return (
    <div className="relative">
      <Clock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-warm-400" />
      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border bg-white py-2 pl-8 pr-2 text-sm text-warm-900 shadow-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:bg-warm-100 disabled:text-warm-400 ${
          error ? 'border-red-400' : 'border-warm-300 hover:border-green-300'
        }`}
      />
    </div>
  )
}
