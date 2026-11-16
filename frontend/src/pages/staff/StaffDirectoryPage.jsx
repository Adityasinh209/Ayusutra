import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader.jsx'
import Card from '../../components/Card.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { listTherapists } from '../../services/therapists.js'
import { deleteReceptionist, deleteTherapist, listReceptionists } from '../../services/staff.js'
import { ConfirmModal } from '../../components/Modal.jsx'
import Alert from '../../components/Alert.jsx'

function specList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function Detail({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-0.5 text-sm text-stone-800">{value}</p>
    </div>
  )
}

function TherapistCard({ therapist, onDelete }) {
  const specs = specList(therapist.specializations)
  const languages = specList(therapist.languages)
  const experience = therapist.experience ?? therapist.experienceYears
  const status = therapist.availabilityStatus || therapist.status || 'Available'
  const shiftStart = therapist.shiftStart || therapist.workStartTime
  const shiftEnd = therapist.shiftEnd || therapist.workEndTime

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-stone-900">{therapist.name}</p>
          <p className="mt-0.5 text-xs text-stone-500">User ID: {therapist.userId || '—'} · Therapist ID: {therapist.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={status} />
          <Button type="button" variant="danger" size="sm" onClick={() => onDelete(therapist)}>Delete</Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {specs.length ? specs.map((spec) => (
          <span key={spec} className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
            {spec}
          </span>
        )) : <span className="text-xs text-stone-400">No specializations listed</span>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Detail label="Gender" value={therapist.gender} />
        <Detail label="Qualification" value={therapist.qualification} />
        <Detail label="Experience" value={experience ? `${experience} years` : ''} />
        <Detail label="Registration no." value={therapist.registrationNumber} />
        <Detail label="Phone" value={therapist.phone} />
        <Detail label="Email" value={therapist.email} />
        <Detail label="Shift" value={shiftStart && shiftEnd ? `${shiftStart} – ${shiftEnd}` : ''} />
        <Detail label="Languages" value={languages.join(', ')} />
      </div>
      {therapist.aboutMe && (
        <p className="mt-4 text-sm leading-relaxed text-stone-600">{therapist.aboutMe}</p>
      )}
    </Card>
  )
}

function ReceptionistCard({ receptionist, onDelete }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-stone-900">{receptionist.name || 'Receptionist'}</p>
          <p className="mt-0.5 text-xs text-stone-500">User ID: {receptionist.userId || '—'} · Record ID: {receptionist.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={receptionist.roleLabel || 'Receptionist'} color="receptionist" />
          <Button type="button" variant="danger" size="sm" onClick={() => onDelete(receptionist)}>Delete</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Detail label="Email" value={receptionist.email} />
        <Detail label="Phone" value={receptionist.phone} />
        <Detail label="Shift" value={receptionist.shift} />
        <Detail label="Gender" value={receptionist.gender} />
        <Detail label="Qualification" value={receptionist.qualification} />
        <Detail
          label="Experience"
          value={receptionist.yearsOfExperience ? `${receptionist.yearsOfExperience} years` : ''}
        />
        <Detail label="Address" value={receptionist.address} />
      </div>
    </Card>
  )
}

export default function StaffDirectoryPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('therapists')
  const [therapists, setTherapists] = useState([])
  const [receptionists, setReceptionists] = useState([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listTherapists().catch(() => []), listReceptionists().catch(() => [])])
      .then(([th, rec]) => {
        setTherapists(th)
        setReceptionists(rec)
      })
      .finally(() => setLoading(false))
  }, [])

  async function confirmDelete() {
    if (!pending) return
    setBusy(true)
    setError('')
    try {
      if (pending.kind === 'therapist') {
        await deleteTherapist(pending.record.id)
        setTherapists((rows) => rows.filter((row) => row.id !== pending.record.id))
      } else {
        await deleteReceptionist(pending.record.id)
        setReceptionists((rows) => rows.filter((row) => row.id !== pending.record.id))
      }
      setPending(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageSpinner />

  const rows = tab === 'therapists' ? therapists : receptionists

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinic staff directory"
        subtitle="User IDs and professional details for therapists and receptionists."
        action={<Button onClick={() => navigate('/staff/register')}>Register staff</Button>}
      />

      {error && <Alert message={error} onClose={() => setError('')} />}

      <div className="flex gap-2">
        <Button type="button" variant={tab === 'therapists' ? 'primary' : 'secondary'} onClick={() => setTab('therapists')}>
          Therapists ({therapists.length})
        </Button>
        <Button type="button" variant={tab === 'receptionists' ? 'primary' : 'secondary'} onClick={() => setTab('receptionists')}>
          Receptionists ({receptionists.length})
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={tab === 'therapists' ? 'No therapists on the roster' : 'No receptionists registered'}
          description="Register clinic staff to see their user ID and contact details here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tab === 'therapists'
            ? therapists.map((therapist) => (
              <TherapistCard
                key={therapist.id}
                therapist={therapist}
                onDelete={(record) => setPending({ kind: 'therapist', record })}
              />
            ))
            : receptionists.map((receptionist) => (
              <ReceptionistCard
                key={receptionist.id}
                receptionist={receptionist}
                onDelete={(record) => setPending({ kind: 'receptionist', record })}
              />
            ))}
        </div>
      )}

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmDelete}
        loading={busy}
        variant="danger"
        title="Delete staff account"
        confirmLabel="Delete"
        message={pending ? `${pending.record.name || 'This user'} will lose access. Clinical records already created stay on file.` : ''}
      />
    </div>
  )
}
