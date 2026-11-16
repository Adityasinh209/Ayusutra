import { useEffect, useState } from 'react'
import { listTherapies } from '../../services/therapies.js'
import { listTherapists } from '../../services/therapists.js'
import { listRooms } from '../../services/rooms.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card, { CardHeader } from '../../components/Card.jsx'
import Badge from '../../components/Badge.jsx'
import Table from '../../components/Table.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'

function cell(value) {
  const text = value == null || value === '' ? '—' : String(value)
  return <span className="block max-w-[14rem] truncate whitespace-nowrap" title={text}>{text}</span>
}

const THERAPY_COLS = [
  { key: 'name', label: 'Therapy', render: (r) => cell(r.name) },
  { key: 'category', label: 'Category', render: (r) => cell(r.category || 'Therapy') },
  { key: 'stage', label: 'Stage', render: (r) => cell(r.stage || 'Purva Karma') },
  { key: 'defaultDurationMins', label: 'Duration', render: (r) => cell(`${r.defaultDurationMins || 60} min`) },
  { key: 'defaultSessionCount', label: 'Sessions', render: (r) => cell(r.defaultSessionCount || 7) },
  { key: 'requiredRoomType', label: 'Room', render: (r) => cell(r.requiredRoomType || 'General') },
  {
    key: 'requiredTherapistSpecialization',
    label: 'Specialization',
    render: (r) => cell(r.requiredTherapistSpecialization || r.name),
  },
  { key: 'active', label: 'Status', render: (r) => <Badge label={r.active ? 'Active' : 'Inactive'} /> },
]

const ROOM_COLS = [
  { key: 'name', label: 'Room', render: (r) => cell(r.name) },
  { key: 'roomType', label: 'Type', render: (r) => cell(r.roomType) },
  { key: 'equipment', label: 'Equipment', render: (r) => cell(r.equipment || 'Standard therapy setup') },
  { key: 'active', label: 'Status', render: (r) => <Badge label={r.active ? 'Operational' : 'Maintenance'} /> },
]

function specs(therapist) {
  const raw = therapist.specializations
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  return typeof raw === 'string' ? raw : ''
}

const THERAPIST_COLS = [
  { key: 'name', label: 'Name', render: (r) => cell(r.name) },
  { key: 'gender', label: 'Gender', render: (r) => cell(r.gender || '—') },
  { key: 'specializations', label: 'Specializations', render: (r) => cell(specs(r) || '—') },
  { key: 'qualification', label: 'Qualification', render: (r) => cell(r.qualification || '—') },
  {
    key: 'experience',
    label: 'Experience',
    render: (r) => cell(`${r.experience ?? r.experienceYears ?? 0} yrs`),
  },
  {
    key: 'shift',
    label: 'Shift',
    render: (r) => cell(`${r.shiftStart || r.workStartTime || '—'} – ${r.shiftEnd || r.workEndTime || '—'}`),
  },
  {
    key: 'availabilityStatus',
    label: 'Status',
    render: (r) => <Badge label={r.availabilityStatus || r.status || (r.active ? 'Available' : 'Inactive')} />,
  },
]

export default function MastersPage() {
  const [therapies, setTherapies] = useState([])
  const [therapists, setTherapists] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listTherapies(), listTherapists(), listRooms()])
      .then(([t, th, r]) => {
        setTherapies(t)
        setTherapists(th)
        setRooms(r)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Panchakarma Clinical Masters"
        subtitle="Therapies, rooms, and therapists in compact tables"
      />

      <Card>
        <CardHeader title="Therapies" subtitle={`${therapies.length} procedures`} />
        <Table columns={THERAPY_COLS} rows={therapies} emptyMessage="No therapies configured." />
      </Card>

      <Card>
        <CardHeader title="Therapy rooms" subtitle={`${rooms.length} rooms`} />
        <Table columns={ROOM_COLS} rows={rooms} emptyMessage="No rooms configured." />
      </Card>

      <Card>
        <CardHeader title="Therapists" subtitle={`${therapists.length} practitioners`} />
        <Table columns={THERAPIST_COLS} rows={therapists} emptyMessage="No therapists on the roster." />
      </Card>
    </div>
  )
}
