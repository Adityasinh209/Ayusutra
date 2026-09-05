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
  const [stageFilter, setStageFilter] = useState('all')

  // Lookups
  const patients = Object.fromEntries(getAll('patients').map((p) => [p.id, p]))
  const therapies = Object.fromEntries(getAll('therapies').map((t) => [t.id, t]))
  const therapists = Object.fromEntries(getAll('therapists').map((t) => [t.id, t]))
  const rooms = Object.fromEntries(getAll('therapy_rooms').map((r) => [r.id, r]))

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

  useEffect(() => {
    load()
  }, [])

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelAppointment(cancelTarget.id)
      setAppointments((prev) =>
        prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: 'Cancelled' } : a)),
      )
      setCancelTarget(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setCancelling(false)
    }
  }

  const filtered = appointments.filter((a) => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    const matchStage = stageFilter === 'all' || a.treatmentStage === stageFilter
    return matchStatus && matchStage
  })

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (r) => (
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/patients/${r.patientId}`)
            }}
            className="text-emerald-800 hover:text-emerald-950 font-bold text-left cursor-pointer"
          >
            {patients[r.patientId]?.fullName ?? 'Patient'}
          </button>
          <span className="text-[10px] text-stone-400 block">
            {patients[r.patientId]?.prakriti || 'Vata-Pitta'}
          </span>
        </div>
      ),
    },
    {
      key: 'therapy',
      label: 'Therapy & Stage',
      render: (r) => (
        <div>
          <span className="font-semibold text-stone-900 block text-xs">
            {therapies[r.therapyId]?.name ?? 'Therapy'}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                r.treatmentStage === 'Pradhana Karma'
                  ? 'bg-amber-100 text-amber-900'
                  : r.treatmentStage === 'Paschat Karma'
                  ? 'bg-purple-100 text-purple-900'
                  : 'bg-blue-100 text-blue-900'
              }`}
            >
              {r.treatmentStage || 'Purva Karma'}
            </span>
            {r.sessionNumber && (
              <span className="text-[10px] text-stone-500 font-medium">
                #{r.sessionNumber}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'therapist',
      label: 'Therapist & Room',
      render: (r) => (
        <div className="text-xs">
          <span className="font-medium text-stone-800 block">✋ {therapists[r.therapistId]?.name ?? '—'}</span>
          <span className="text-[11px] text-stone-500 block">🏛️ {rooms[r.roomId]?.name ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Schedule',
      render: (r) => (
        <div className="text-xs">
          <span className="font-medium text-stone-800 block">{formatDate(r.date)}</span>
          <span className="text-stone-500 block">{formatTime(r.startTime)} – {formatTime(r.endTime)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge label={r.status} />,
    },
    {
      key: 'observations',
      label: 'Clinical Notes',
      render: (r) => (
        <div className="text-[11px] text-stone-600 max-w-xs">
          {r.sessionNotes || r.therapistObservations ? (
            <span className="line-clamp-2">{r.sessionNotes || r.therapistObservations}</span>
          ) : (
            <span className="text-stone-300 italic">No notes recorded</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        r.status !== 'Cancelled' && r.status !== 'Completed' ? (
          <Button
            size="xs"
            variant="ghost"
            className="text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation()
              setCancelTarget(r)
            }}
          >
            Cancel
          </Button>
        ) : null,
    },
  ]

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panchakarma Therapy Sessions"
        subtitle={`${appointments.length} total scheduled, confirmed, and completed procedural sessions`}
        action={
          <Button onClick={() => navigate('/scheduling')}>
            + AI Smart Scheduler
          </Button>
        }
      />

      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}

      {/* Filter Matrix */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-stone-500 mr-1">Status:</span>
          {['all', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                statusFilter === s
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-stone-500 mr-1">Stage:</span>
          {['all', 'Purva Karma', 'Pradhana Karma', 'Paschat Karma'].map((st) => (
            <button
              key={st}
              onClick={() => setStageFilter(st)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                stageFilter === st
                  ? 'bg-emerald-800 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {st === 'all' ? 'All Stages' : st}
            </button>
          ))}
        </div>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        emptyMessage="No therapy sessions match the selected filters."
      />

      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={cancelling}
        title="Cancel Therapy Session"
        message={`Are you sure you want to cancel this ${therapies[cancelTarget?.therapyId]?.name || 'therapy'} session for ${cancelTarget ? patients[cancelTarget.patientId]?.fullName : ''}?`}
        confirmLabel="Confirm Cancellation"
      />
    </div>
  )
}
