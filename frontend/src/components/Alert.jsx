const STYLES = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
}

export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null
  return (
    <div className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${STYLES[type]}`} role="alert">
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer text-lg leading-none">
          ×
        </button>
      )}
    </div>
  )
}
