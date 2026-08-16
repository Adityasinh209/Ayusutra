export default function FormField({ label, error, required: req, children, hint }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {req && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputBase =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500'

export function Input({ error, className = '', ...props }) {
  return (
    <input
      className={`${inputBase} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''} ${className}`}
      {...props}
    />
  )
}

export function Textarea({ error, className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`${inputBase} resize-none ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''} ${className}`}
      {...props}
    />
  )
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select
      className={`${inputBase} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}
