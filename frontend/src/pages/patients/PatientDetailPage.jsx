import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { getPatient } from '../../services/patients.js'
import { getEmrForPatient } from '../../services/emr.js'
import { getAppointmentsForPatient } from '../../services/appointments.js'
import { getPlansForPatient, updatePlanStage } from '../../services/plans.js'
import { getTherapy } from '../../services/therapies.js'
import { getTherapist } from '../../services/therapists.js'
import { getRoom } from '../../services/rooms.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card, { CardHeader } from '../../components/Card.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import Alert from '../../components/Alert.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { formatDate, formatTime, formatDateTime, calculateAge } from '../../utils/date.js'

export default function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [emrRecords, setEmrRecords] = useState([])
  const [appointments, setAppointments] = useState([])
  const [plans, setPlans] = useState([])
  const [enriched, setEnriched] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [advancingStage, setAdvancingStage] = useState(false)

  const isPatientViewingOther = user?.role === 'patient' && user?.patientId && user.patientId !== id

  async function loadData() {
    if (isPatientViewingOther) {
      setLoading(false)
      setError('Access Restricted: You are only authorized to view your own patient profile.')
      return
    }
    try {
      const [p, emrs, appts, patientPlans] = await Promise.all([
        getPatient(id),
        getEmrForPatient(id),
        getAppointmentsForPatient(id),
        getPlansForPatient(id),
      ])
      setPatient(p)
      setEmrRecords(emrs)
      setAppointments(appts)
      setPlans(patientPlans)

      // Enrich appointments and active plan
      const enrichMap = {}
      await Promise.all(
        appts.map(async (a) => {
          const [therapy, therapist, room] = await Promise.all([
            getTherapy(a.therapyId),
            getTherapist(a.therapistId),
            getRoom(a.roomId),
          ])
          enrichMap[a.id] = { therapy, therapist, room }
        }),
      )
      setEnriched(enrichMap)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id, isPatientViewingOther])

  async function handleAdvanceStage(planId, currentStage) {
    const stageSequence = ['Purva Karma', 'Pradhana Karma', 'Paschat Karma', 'Follow-up', 'Completed']
    const nextIdx = stageSequence.indexOf(currentStage) + 1
    if (nextIdx >= stageSequence.length) return
    const nextStage = stageSequence[nextIdx]

    setAdvancingStage(true)
    try {
      await updatePlanStage(planId, nextStage)
      await loadData()
    } catch (e) {
      setError(e.message)
    } finally {
      setAdvancingStage(false)
    }
  }

  if (loading) return <PageSpinner />
  if (isPatientViewingOther) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4 text-center">
        <Alert
          type="error"
          message="Privacy Protection: As a patient, you cannot view details of other patients."
        />
        <Button onClick={() => navigate(`/patients/${user.patientId}`)}>
          Go to My Profile &amp; Treatment Plan
        </Button>
      </div>
    )
  }
  if (error) return <Alert message={error} />
  if (!patient) return null

  const age = calculateAge(patient.dateOfBirth)
  const activePlan = plans.find((pl) => pl.status === 'In Progress' || pl.status === 'Active') || plans[0]

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title={patient.fullName}
        subtitle={`${age} yrs · ${patient.gender} · Prakriti: ${patient.prakriti || 'N/A'} · Registered ${formatDate(patient.registeredAt)}`}
        back={
          user.role === 'patient'
            ? { label: 'Dashboard', onClick: () => navigate('/dashboard') }
            : { label: 'Patients Directory', onClick: () => navigate('/patients') }
        }
        action={
          <div className="flex gap-2">
            {(user.role === 'doctor' || user.role === 'admin') && (
              <Button onClick={() => navigate('/consultation', { state: { patientId: id } })}>
                + New Assessment
              </Button>
            )}
            {(user.role === 'receptionist' || user.role === 'admin') && (
              <Button variant="secondary" onClick={() => navigate('/scheduling', { state: { patientId: id } })}>
                ✨ Schedule Session
              </Button>
            )}
          </div>
        }
      />

      {/* 1. Ayurvedic Constitutional Profile & Clinical Baseline */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Ayurvedic Constitutional Assessment" subtitle="Prakriti, Agni, and Koshta evaluation" />
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide block mb-1">
                Prakriti (Constitution)
              </span>
              <span className="font-bold text-base text-stone-900">{patient.prakriti || 'Vata-Pitta'}</span>
              <span className="text-xs text-stone-500 block mt-0.5">Inherent constitutional dosha balance</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide block mb-1">
                Vikriti (Imbalance State)
              </span>
              <span className="font-bold text-base text-stone-900">{patient.vikriti || 'Under Clinical Evaluation'}</span>
              <span className="text-xs text-stone-500 block mt-0.5">Current dosha morbidity (Dushti)</span>
            </div>
            <div>
              <p className="text-xs text-stone-400">Agni (Digestive Fire)</p>
              <p className="font-medium text-stone-800 mt-0.5">{patient.agniType || 'Sama Agni'}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Koshta (Bowel Quality)</p>
              <p className="font-medium text-stone-800 mt-0.5">{patient.koshtaType || 'Madhyama'}</p>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-400">Chief Presenting Complaints</p>
              <p className="text-stone-800 font-medium mt-0.5">
                {patient.chiefComplaint || patient.medicalHistory || 'None recorded at intake.'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Contact &amp; Emergency Details" />
          <dl className="space-y-2.5 text-xs">
            <Row label="Phone" value={patient.phone} />
            <Row label="Email" value={patient.email || '—'} />
            <Row label="Address" value={patient.address} />
            <Row label="Emergency" value={patient.emergencyContact} />
            <Row label="Allergies" value={patient.allergies || 'None reported'} />
          </dl>
        </Card>
      </div>

      {/* 2. Current Active Panchakarma Plan */}
      <Card className="border-emerald-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">Current Panchakarma Treatment Plan</h3>
              {activePlan && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {activePlan.treatmentStage}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Supervised protocol moving through Purva, Pradhana, and Paschat stages
            </p>
          </div>

          {activePlan && user.role === 'doctor' && activePlan.treatmentStage !== 'Completed' && (
            <Button
              size="xs"
              variant="secondary"
              loading={advancingStage}
              onClick={() => handleAdvanceStage(activePlan.id, activePlan.treatmentStage)}
            >
              Advance Stage →
            </Button>
          )}
        </div>

        {!activePlan ? (
          <EmptyState
            title="No active treatment plan"
            description="The doctor has not created a Panchakarma plan for this patient yet."
          />
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="text-stone-400 block mb-0.5">Selected Procedure</span>
                <span className="font-bold text-stone-900 text-sm">
                  {activePlan.procedureName || activePlan.primaryPanchakarma}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="text-stone-400 block mb-0.5">Treatment Stage</span>
                <span className="font-bold text-emerald-800 text-sm">
                  {activePlan.treatmentStage}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="text-stone-400 block mb-0.5">Session Progress</span>
                <span className="font-bold text-stone-900 text-sm">
                  {activePlan.completedSessions || 0} / {activePlan.totalSessions || 7} Sessions
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="text-stone-400 block mb-0.5">Follow-up Date</span>
                <span className="font-bold text-stone-900 text-sm">
                  {activePlan.followUpDate ? formatDate(activePlan.followUpDate) : 'Not scheduled'}
                </span>
              </div>
            </div>

            {/* Visual stage progress pipeline */}
            <div className="py-2">
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Clinical Stage Pipeline
              </p>
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                {['Consultation', 'Purva Karma', 'Pradhana Karma', 'Paschat Karma', 'Follow-up'].map((stage, i) => {
                  const stageOrder = ['Consultation', 'Purva Karma', 'Pradhana Karma', 'Paschat Karma', 'Follow-up', 'Completed']
                  const currentIdx = stageOrder.indexOf(activePlan.treatmentStage)
                  const isCurrent = activePlan.treatmentStage === stage
                  const isPast = currentIdx > i

                  return (
                    <div
                      key={stage}
                      className={`p-2 rounded-lg font-medium transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isPast
                          ? 'bg-emerald-100 text-emerald-800 font-semibold'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      <span className="block text-[10px] opacity-75">Step {i + 1}</span>
                      <span className="text-xs truncate block">{stage}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Instructions & Pathya-Apathya */}
            <div className="grid sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-stone-100">
              <div>
                <p className="font-bold text-stone-800 mb-1">🌿 Doctor Instructions</p>
                <p className="text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100 leading-relaxed">
                  {activePlan.doctorInstructions || 'Administer prescribed therapies per classical protocols.'}
                </p>
              </div>
              <div>
                <p className="font-bold text-stone-800 mb-1">🥣 Pathya-Apathya (Diet &amp; Lifestyle)</p>
                <p className="text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100 leading-relaxed">
                  {activePlan.dietPlan || 'Light, warm freshly cooked meals (Peya/Yusha). Avoid cold water & day sleep.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 3. Ayurvedic Assessment & EMR Consultations */}
      <Card>
        <CardHeader
          title="Ayurvedic Assessment &amp; EMR Records"
          subtitle={`${emrRecords.length} clinical consultation record${emrRecords.length !== 1 ? 's' : ''}`}
        />
        {emrRecords.length === 0 ? (
          <EmptyState
            title="No EMR records"
            description="The Vaidya has not recorded a clinical consultation for this patient yet."
          />
        ) : (
          <div className="space-y-4">
            {emrRecords.map((r) => (
              <EmrCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </Card>

      {/* 4. Therapy Sessions History */}
      <Card>
        <CardHeader
          title="Panchakarma Therapy Sessions"
          subtitle={`${appointments.length} session${appointments.length !== 1 ? 's' : ''} on record`}
          action={
            (user.role === 'receptionist' || user.role === 'admin') && (
              <Button size="xs" onClick={() => navigate('/scheduling', { state: { patientId: id } })}>
                + Schedule Next Session
              </Button>
            )
          }
        />
        {appointments.length === 0 ? (
          <EmptyState title="No therapy sessions" description="No therapy sessions scheduled yet." />
        ) : (
          <div className="space-y-2.5">
            {appointments.map((a) => {
              const e = enriched[a.id] ?? {}
              return (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-900">{e.therapy?.name ?? 'Therapy'}</span>
                      {a.sessionNumber && (
                        <span className="text-xs text-stone-500 font-medium">Session #{a.sessionNumber}</span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-medium">
                        {a.treatmentStage || 'Purva Karma'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      📅 {formatDate(a.date)} · 🕒 {formatTime(a.startTime)} – {formatTime(a.endTime)}
                    </p>
                    <p className="text-xs text-stone-400">
                      🏛️ {e.room?.name ?? 'Room'} · ✋ {e.therapist?.name ?? 'Therapist'}
                    </p>
                    {a.sessionNotes && (
                      <p className="text-xs text-stone-600 bg-white p-2 rounded border border-stone-100 mt-1.5">
                        <span className="font-semibold text-stone-700">Therapist Notes: </span>
                        {a.sessionNotes}
                      </p>
                    )}
                  </div>
                  <Badge label={a.status} />
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-stone-400">{label}</dt>
      <dd className="text-stone-700 font-medium truncate">{value}</dd>
    </div>
  )
}

function EmrCard({ record }) {
  return (
    <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs text-stone-400">{formatDateTime(record.createdAt)}</span>
          <p className="text-sm font-bold text-stone-900 mt-0.5">{record.diagnosis}</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
          {record.treatmentStage || 'Purva Karma'}
        </span>
      </div>

      {record.ashtavidhaPariksha && (
        <div className="p-3 bg-white rounded-lg border border-stone-100 text-xs">
          <p className="font-bold text-stone-800 mb-1.5">Ashtavidha Pariksha (Eight-Fold Clinical Examination)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-600">
            <div><span className="text-stone-400">Nadi: </span>{record.ashtavidhaPariksha.nadi}</div>
            <div><span className="text-stone-400">Mutra: </span>{record.ashtavidhaPariksha.mutra}</div>
            <div><span className="text-stone-400">Mala: </span>{record.ashtavidhaPariksha.mala}</div>
            <div><span className="text-stone-400">Jihva: </span>{record.ashtavidhaPariksha.jihva}</div>
            <div><span className="text-stone-400">Shabda: </span>{record.ashtavidhaPariksha.shabda}</div>
            <div><span className="text-stone-400">Sparsha: </span>{record.ashtavidhaPariksha.sparsha}</div>
            <div><span className="text-stone-400">Druk: </span>{record.ashtavidhaPariksha.druk}</div>
            <div><span className="text-stone-400">Aakruti: </span>{record.ashtavidhaPariksha.aakruti}</div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-stone-400">Symptoms &amp; Manifestations</p>
          <p className="text-stone-700 mt-0.5">{record.symptoms}</p>
        </div>
        <div>
          <p className="text-stone-400">Panchakarma Protocol</p>
          <p className="text-stone-700 mt-0.5">{record.treatmentPlan}</p>
        </div>
        {record.doctorNotes && (
          <div className="sm:col-span-2">
            <p className="text-stone-400">Vaidya Clinical Instructions</p>
            <p className="text-stone-700 mt-0.5">{record.doctorNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
