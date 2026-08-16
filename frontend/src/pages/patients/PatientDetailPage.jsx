import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { getPatient } from '../../services/patients.js'
import { getEmrForPatient } from '../../services/emr.js'
import { getAppointmentsForPatient } from '../../services/appointments.js'
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
  const [enriched, setEnriched] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [p, emrs, appts] = await Promise.all([
          getPatient(id),
          getEmrForPatient(id),
          getAppointmentsForPatient(id),
        ])
        setPatient(p)
        setEmrRecords(emrs)
        setAppointments(appts)

        // Enrich appointments with therapy/therapist/room names
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
    load()
  }, [id])

  if (loading) return <PageSpinner />
  if (error) return <Alert message={error} />
  if (!patient) return null

  const age = calculateAge(patient.dateOfBirth)

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={patient.fullName}
        subtitle={`${age} yrs · ${patient.gender} · Registered ${formatDate(patient.registeredAt)}`}
        back={{ label: 'All Patients', onClick: () => navigate('/patients') }}
        action={
          user.role === 'doctor' && (
            <Button onClick={() => navigate('/consultation', { state: { patientId: id } })}>
              + New Consultation
            </Button>
          )
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Contact Information" />
          <dl className="space-y-3 text-sm">
            <Row label="Phone" value={patient.phone} />
            <Row label="Email" value={patient.email || '—'} />
            <Row label="Address" value={patient.address} />
            <Row label="Emergency Contact" value={patient.emergencyContact} />
          </dl>
        </Card>
        <Card>
          <CardHeader title="Medical Background" />
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {patient.medicalHistory || <span className="text-gray-400">None recorded.</span>}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Consultation &amp; EMR Records" subtitle={`${emrRecords.length} record${emrRecords.length !== 1 ? 's' : ''}`} />
        {emrRecords.length === 0 ? (
          <EmptyState title="No EMR records" description="The doctor has not yet created a consultation record for this patient." />
        ) : (
          <div className="space-y-4">
            {emrRecords.map((r) => (
              <EmrCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Appointments"
          subtitle={`${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`}
          action={
            user.role === 'receptionist' && (
              <Button size="sm" onClick={() => navigate('/scheduling', { state: { patientId: id } })}>
                + Schedule
              </Button>
            )
          }
        />
        {appointments.length === 0 ? (
          <EmptyState title="No appointments" description="No therapy sessions have been scheduled yet." />
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => {
              const e = enriched[a.id] ?? {}
              return (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.therapy?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(a.date)} · {formatTime(a.startTime)} – {formatTime(a.endTime)}
                    </p>
                    <p className="text-xs text-gray-400">{e.therapist?.name ?? '—'} · {e.room?.name ?? '—'}</p>
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
      <dt className="w-36 shrink-0 text-gray-400">{label}</dt>
      <dd className="text-gray-700">{value}</dd>
    </div>
  )
}

function EmrCard({ record }) {
  return (
    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs text-gray-400">{formatDateTime(record.createdAt)}</p>
        <span className="text-xs text-gray-500">{record.numberOfSessions} sessions · {record.therapyDurationMins} min each</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <EmrField label="Symptoms" value={record.symptoms} />
        <EmrField label="Diagnosis" value={record.diagnosis} />
        <EmrField label="Treatment Plan" value={record.treatmentPlan} />
        <EmrField label="Doctor Notes" value={record.doctorNotes} />
        <EmrField label="Follow-up Date" value={formatDate(record.followUpDate)} />
      </div>
    </div>
  )
}

function EmrField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-gray-700">{value || '—'}</p>
    </div>
  )
}
