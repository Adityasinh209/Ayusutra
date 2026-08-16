const COLORS = {
  Scheduled: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Confirmed: 'bg-green-50 text-green-700 ring-green-600/20',
  Completed: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  Cancelled: 'bg-red-50 text-red-600 ring-red-600/20',
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  inactive: 'bg-gray-100 text-gray-500 ring-gray-500/20',
  admin: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  doctor: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  receptionist: 'bg-teal-50 text-teal-700 ring-teal-600/20',
}

export default function Badge({ label, color }) {
  const cls = COLORS[color ?? label] ?? 'bg-gray-100 text-gray-600 ring-gray-500/20'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  )
}
