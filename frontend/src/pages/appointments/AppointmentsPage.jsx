import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAppointments, cancelAppointment } from '../../services/appointments.js'
import { getAll } from '../../mocks/store.js'
import PageHeader from '../../components/PageHeader.jsx'
import Table from '../../components/Table.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import { ConfirmModal } from '../../components/Modal.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import Alert from '../../components/Alert.jsx'
import { formatDate, formatTime } from '../../utils/date.js'

export default function AppointmentsPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  // Lookup maps for display
  const patients = Object.fromEntries(getAll('patients').map((p) => [p.id, p.fullName]))
  const therapies = Object.fromEntries(getAll('therapies').map((t) => [t.id, t.name]))
  const therapists = Object.fromEntries(getAll('therapists').map((t) => [t.id, t.name]))

  async function load() {
    try {
      const data = await listAppointments()
      setAppointments(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelAppointment(cancelTarget.id)
      setAppointments((prev) => prev.map((a) => a.id === cancelTarget.id ? { ...a, status: 'Cancelled' } : a))
      setCancelTarget(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setCancelling(false)
    }
  }

  const filtered = statusFilter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === statusFilter)

  const columns = [
    { key: 'patient', label: 'Patient', render: (r) => (
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/patients/${r.patientId}`) }}
        className="text-green-600 hover:text-green-700 font-medium"
      >
        {patients[r.patientId] ?? '—'}
      </button>
    )},
    { key: 'therapy', label: 'Therapy', render: (r) => therapies[r.therapyId] ?? '—' },
    { key: 'therapist', label: 'Therapist', render: (r) => therapists[r.therapistId] ?? '—' },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'time', label: 'Time', render: (r) => `${formatTime(r.startTime)} – ${formatTime(r.endTime)}` },
    { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} /> },
    {
      key: 'actions', label: '',
      render: (r) => r.status !== 'Cancelled' && r.status !== 'Completed' ? (
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-700"
          onClick={(e) => { e.stopPropagation(); setCancelTarget(r) }}
        >
          Cancel
        </Button>
      ) : null,
    },
  ]

  if (loading) return <PageSpinner />

  return (
    <div>
      <PageHeader title="Appointments" subtitle={`${appointments.length} total appointment${appointments.length !== 1 ? 's' : ''}`} />

      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
              statusFilter === s
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        rows={filtered}
        emptyMessage="No appointments match the selected filter."
      />

      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={cancelling}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel this appointment for ${cancelTarget ? patients[cancelTarget.patientId] : ''}? This action cannot be undone.`}
        confirmLabel="Cancel Appointment"
      />
    </div>
  )
}
