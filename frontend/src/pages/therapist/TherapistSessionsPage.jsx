import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { getAppointmentsForTherapist, completeAppointment, listAppointments } from '../../services/appointments.js'
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
  const [observations, setObservations] = useState('')
  const [doctorRemarks, setDoctorRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function loadSessions() {
    setLoading(true)
    try {
      // If user has a therapistId use that, otherwise if admin/doctor show all sessions
      let data = []
      if (user?.therapistId) {
        data = await getAppointmentsForTherapist(user.therapistId)
      } else {
        data = await listAppointments()
      }
      setSessions(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [user?.therapistId])

  async function loadDetail(session) {
    setSelected(session)
    setObservations(session.therapistObservations || session.sessionNotes || '')
    setDoctorRemarks(session.doctorRemarks || '')
    setDetail(null)
    try {
      const [patient, therapy, room, emrRecords] = await Promise.all([
        getPatient(session.patientId),
        getTherapy(session.therapyId),
        getRoom(session.roomId),
        getEmrForPatient(session.patientId),
      ])
      const matchedEmr = emrRecords.find((r) => r.therapyId === session.therapyId) || emrRecords[0]
      const doctorInstructions = matchedEmr?.doctorNotes || matchedEmr?.treatmentPlan || 'Perform procedure per classical Ayurvedic protocol.'
      const dietInstructions = matchedEmr?.dietaryInstructions || 'Follow light diet.'

      setDetail({ patient, therapy, room, doctorInstructions, dietInstructions, matchedEmr })
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleComplete() {
    if (!selected) return
    setCompleting(true)
    try {
      await completeAppointment(selected.id, {
        sessionNotes: observations,
        therapistObservations: observations,
        doctorRemarks,
      })
      setConfirmOpen(false)
      setSuccess('Panchakarma session marked as completed and recorded in patient timeline.')
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
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title="Therapist Assigned Sessions"
        subtitle={`Panchakarma procedural administration log for ${user?.name}`}
      />

      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-4" />}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left 2 Cols: Session Queue */}
        <div className="lg:col-span-2">
          <Card padding={false} className="border-stone-200">
            <div className="px-4 py-3.5 border-b border-stone-100 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Assigned Sessions ({sessions.length})
              </span>
              <span className="text-[11px] text-stone-400">Click to log details</span>
            </div>
            {sessions.length === 0 ? (
              <EmptyState
                title="No assigned sessions"
                description="You have no therapy sessions scheduled at this time."
              />
            ) : (
              <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
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

        {/* Right 3 Cols: Active Session Inspection & Recording */}
        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="border-stone-200 h-full flex flex-col justify-center items-center py-16">
              <EmptyState
                title="Select a Therapy Session"
                description="Choose a session from the assigned roster to inspect Vaidya instructions, prep guidelines, and record clinical observations."
              />
            </Card>
          ) : !detail ? (
            <PageSpinner />
          ) : (
            <Card className="border-stone-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {detail.patient.fullName} — {detail.therapy.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    📅 {formatDate(selected.date)} · 🕒 {formatTime(selected.startTime)} – {formatTime(selected.endTime)} · 🏛️ {detail.room.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {selected.treatmentStage || 'Purva Karma'}
                  </span>
                  <Badge label={selected.status} />
                </div>
              </div>

              {/* Patient & Procedure Metadata */}
              <div className="grid sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                <div>
                  <span className="text-stone-400 block">Patient Details</span>
                  <span className="font-bold text-stone-800">
                    {detail.patient.fullName} ({calculateAge(detail.patient.dateOfBirth)} yrs, {detail.patient.gender})
                  </span>
                  <span className="text-stone-500 block mt-0.5">
                    Prakriti: <strong>{detail.patient.prakriti || 'N/A'}</strong> · Agni: {detail.patient.agniType || 'Sama'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Therapy Specifications</span>
                  <span className="font-bold text-stone-800">{detail.therapy.name} ({detail.therapy.defaultDurationMins} min)</span>
                  <span className="text-stone-500 block mt-0.5">Facility: {detail.room.name}</span>
                </div>
              </div>

              {/* Vaidya Clinical Instructions */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                  🌿 Vaidya Clinical Instructions
                </p>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-stone-700 leading-relaxed">
                  {detail.doctorInstructions}
                </div>
              </div>

              {/* Preparation & Post-treatment Guidelines */}
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="font-bold text-stone-800 mb-1">Pre-Procedure Preparation</p>
                  <p className="text-stone-600">
                    {detail.therapy.preparationRequirements || 'Warm prescribed taila to body temperature. Verify patient resting vitals.'}
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="font-bold text-stone-800 mb-1">Post-Procedure Protocol</p>
                  <p className="text-stone-600">
                    {detail.therapy.postTreatmentInstructions || 'Wipe excess oil. 15 minutes calm rest. Avoid exposure to air currents.'}
                  </p>
                </div>
              </div>

              {/* Already Completed Notes */}
              {selected.status === 'Completed' && (
                <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
                  <p className="font-bold text-stone-800">Logged Session Observations</p>
                  <div className="p-3 bg-stone-50 rounded-lg text-stone-700">
                    {selected.therapistObservations || selected.sessionNotes || 'Session marked complete without specific observations.'}
                  </div>
                </div>
              )}

              {/* Execution / Logging Form */}
              {canComplete && (
                <div className="space-y-4 pt-3 border-t border-stone-100">
                  <FormField
                    label="Therapist Observations (Ama liquefaction, sweat response, retention duration, relaxation)"
                    hint="Document physical responses observed during the therapy session"
                  >
                    <Textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="e.g. Skin absorption was uniform; patient sweated profusely in Swedana chamber; no dizziness or hypotension reported…"
                      rows={3}
                    />
                  </FormField>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">
                      Completing updates patient Panchakarma session count and timeline
                    </span>
                    <Button onClick={() => setConfirmOpen(true)}>
                      ✓ Complete &amp; Log Session
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => !completing && setConfirmOpen(false)}
        onConfirm={handleComplete}
        loading={completing}
        title="Finalize Panchakarma Session"
        message={`Mark this ${detail?.therapy?.name ?? 'therapy'} session for ${detail?.patient?.fullName ?? 'the patient'} as completed?`}
        confirmLabel="Confirm Completion"
      />
    </div>
  )
}

function SessionRow({ session, active, onClick }) {
  const [label, setLabel] = useState('')
  const [therapyName, setTherapyName] = useState('')

  useEffect(() => {
    getPatient(session.patientId)
      .then((p) => setLabel(p.fullName))
      .catch(() => setLabel('—'))
    getTherapy(session.therapyId)
      .then((t) => setTherapyName(t.name))
      .catch(() => setTherapyName('—'))
  }, [session.patientId, session.therapyId])

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3.5 hover:bg-stone-50 transition-colors cursor-pointer block ${
        active ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <span className="text-sm font-bold text-stone-900 block">{label || '…'}</span>
          <span className="text-xs text-emerald-800 font-medium">{therapyName || 'Therapy'}</span>
        </div>
        <Badge label={session.status} />
      </div>
      <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1">
        <span>📅 {formatDate(session.date)} · 🕒 {formatTime(session.startTime)}</span>
        <span className="font-semibold text-stone-600">{session.treatmentStage || 'Purva Karma'}</span>
      </div>
    </button>
  )
}
