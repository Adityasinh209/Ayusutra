const VARIANTS = {
  primary: 'bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-500 disabled:bg-green-300',
  secondary: 'bg-white text-green-700 border-2 border-green-200 hover:bg-green-50 hover:border-green-300 focus-visible:ring-green-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300',
  ghost: 'text-green-700 hover:bg-green-50 focus-visible:ring-green-500',
  accent: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 focus-visible:ring-amber-500 disabled:from-amber-400 disabled:to-amber-500',
  outline: 'bg-transparent text-green-700 border-2 border-green-300 hover:bg-green-50 hover:border-green-400 focus-visible:ring-green-500',
}

const SIZES = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-medium
        transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-60 cursor-pointer active:scale-[0.98]
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}