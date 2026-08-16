export default function Spinner({ size = 'md', className = '' }) {
  const sz = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-gray-200 border-t-green-600 ${sz} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  )
}
