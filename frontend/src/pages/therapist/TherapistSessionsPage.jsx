import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { getAppointmentsForTherapist, completeAppointment } from '../../services/appointments.js'
import { getPatient } from '../../services/patients.js'
import { getTherapy } from '../../services/therapies.js'
import { getRoom } from '../../services/rooms.js'
import { getEmrForPatient } from '../../services/emr.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card, { CardHeader } from '../../components/Card.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import FormField, { Textarea } from '../../components/FormField.jsx'
import { ConfirmModal } from '../../components/Modal.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Alert from '../../components/Alert.jsx'
import { formatDate, formatTime, calculateAge } from '../../utils/date.js'

export default function TherapistSessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [notes, setNotes] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function loadSessions() {
    setLoading(true)
    try {
      const data = await getAppointmentsForTherapist(user.therapistId)
      setSessions(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [user.therapistId])

  async function loadDetail(session) {
    setSelected(session)
    setNotes(session.sessionNotes ?? '')
    setDetail(null)
    try {
      const [patient, therapy, room, emrRecords] = await Promise.all([
        getPatient(session.patientId),
        getTherapy(session.therapyId),
        getRoom(session.roomId),
        getEmrForPatient(session.patientId),
      ])
      const treatmentPlan = emrRecords.find((r) => r.therapyId === session.therapyId)?.treatmentPlan
        ?? emrRecords[0]?.treatmentPlan
        ?? 'No treatment plan on record.'
      setDetail({ patient, therapy, room, treatmentPlan })
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleComplete() {
    if (!selected) return
    setCompleting(true)
    try {
      await completeAppointment(selected.id, { sessionNotes: notes })
      setConfirmOpen(false)
      setSuccess('Session marked as completed.')
      setSelected(null)
      setDetail(null)
      await loadSessions()
    } catch (e) {
      setError(e.message)
      setConfirmOpen(false)
    } finally {
      setCompleting(false)
    }
  }

  const canComplete = selected && ['Scheduled', 'Confirmed'].includes(selected.status)

  if (loading) return <PageSpinner />

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="My Sessions"
        subtitle={`Assigned therapy sessions for ${user.name}`}
      />

      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-4" />}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card padding={false}>
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                Assigned Sessions ({sessions.length})
              </p>
            </div>
            {sessions.length === 0 ? (
              <EmptyState
                title="No sessions assigned"
                description="You have no therapy sessions scheduled at this time."
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {sessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    active={selected?.id === session.id}
                    onClick={() => loadDetail(session)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <Card>
              <EmptyState
                title="Select a session"
                description="Choose a session from the list to view patient details and record completion."
              />
            </Card>
          ) : !detail ? (
            <PageSpinner />
          ) : (
            <Card>
              <CardHeader
                title={`${detail.patient.fullName} — ${detail.therapy.name}`}
                subtitle={`${formatDate(selected.date)} · ${formatTime(selected.startTime)} – ${formatTime(selected.endTime)} · ${detail.room.name}`}
                action={<Badge label={selected.status} />}
              />

              <div className="space-y-5">
                <section>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Patient</p>
                  <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                    <DetailRow label="Name" value={detail.patient.fullName} />
                    <DetailRow label="Age / Gender" value={`${calculateAge(detail.patient.dateOfBirth)} yrs · ${detail.patient.gender}`} />
                    <DetailRow label="Phone" value={detail.patient.phone} />
                  </dl>
                </section>

                <section>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Therapy</p>
                  <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                    <DetailRow label="Treatment" value={detail.therapy.name} />
                    <DetailRow label="Duration" value={`${detail.therapy.defaultDurationMins} minutes`} />
                  </dl>
                </section>

                <section>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Doctor's Treatment Plan</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-2 border border-gray-100">
                    {detail.treatmentPlan}
                  </p>
                </section>

                {selected.status === 'Completed' && selected.sessionNotes && (
                  <section>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Session Notes</p>
                    <p className="text-sm text-gray-700">{selected.sessionNotes}</p>
                  </section>
                )}

                {canComplete && (
                  <section className="pt-2 border-t border-gray-100">
                    <FormField label="Session Notes" hint="Optional — observations during the therapy session">
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Patient responded well to warm oil application…"
                        rows={3}
                      />
                    </FormField>
                    <div className="mt-4">
                      <Button onClick={() => setConfirmOpen(true)}>Mark as Completed</Button>
                    </div>
                  </section>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => !completing && setConfirmOpen(false)}
        onConfirm={handleComplete}
        loading={completing}
        title="Complete Session"
        message={`Mark this ${detail?.therapy?.name ?? 'therapy'} session for ${detail?.patient?.fullName ?? 'the patient'} as completed?`}
        confirmLabel="Mark Completed"
      />
    </div>
  )
}

function SessionRow({ session, active, onClick }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    getPatient(session.patientId).then((p) => setLabel(p.fullName)).catch(() => setLabel('—'))
  }, [session.patientId])

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
        active ? 'bg-green-50 border-l-2 border-l-green-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">{label || '…'}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(session.date)} · {formatTime(session.startTime)}
          </p>
        </div>
        <Badge label={session.status} />
      </div>
    </button>
  )
}

function DetailRow({ label, value }) {
  return (
    <div>
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-800">{value ?? '—'}</dd>
    </div>
  )
}
