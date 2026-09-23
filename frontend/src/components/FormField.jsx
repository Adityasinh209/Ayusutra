export default function FormField({ label, error, required: req, children, hint, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-warm-700">
          {label}
          {req && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-warm-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border border-warm-300 bg-white px-4 py-3 text-sm text-warm-900 placeholder-warm-400 shadow-sm transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none disabled:bg-warm-100 disabled:text-warm-500 hover:border-green-300'

export function Input({ error, className = '', ...props }) {
  return (
    <input
      className={`${inputBase} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''} ${className}`}
      {...props}
    />
  )
}

export function Textarea({ error, className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`${inputBase} resize-none ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''} ${className}`}
      {...props}
    />
  )
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select
      className={`${inputBase} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}