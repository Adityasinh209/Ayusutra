const COLORS = {
  // Appointment statuses
  Scheduled: 'bg-amber-100 text-amber-800 ring-amber-200',
  Confirmed: 'bg-green-100 text-green-800 ring-green-200',
  Completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Cancelled: 'bg-red-100 text-red-800 ring-red-200',

  // Generic statuses
  active: 'bg-green-100 text-green-800 ring-green-200',
  inactive: 'bg-warm-100 text-warm-600 ring-warm-200',

  // Roles
  admin: 'bg-green-100 text-green-800 ring-green-200',
  doctor: 'bg-sage-100 text-sage-800 ring-sage-200',
  receptionist: 'bg-amber-100 text-amber-800 ring-amber-200',
  therapist: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  patient: 'bg-green-100 text-green-800 ring-green-200',

  // Treatment stages
  'Purva Karma': 'bg-blue-100 text-blue-800 ring-blue-200',
  'Pradhana Karma': 'bg-amber-100 text-amber-800 ring-amber-200',
  'Paschat Karma': 'bg-purple-100 text-purple-800 ring-purple-200',
  'Follow-up': 'bg-indigo-100 text-indigo-800 ring-indigo-200',
}

export default function Badge({ label, color, className = '' }) {
  const cls = COLORS[color ?? label] ?? 'bg-warm-100 text-warm-700 ring-warm-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-medium ring-1 ring-inset ${cls} ${className}`}>
      {label}
    </span>
  )
}