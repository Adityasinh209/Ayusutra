import { useEffect, useState } from 'react'
import { listTherapies } from '../../services/therapies.js'
import { listTherapists, getAvailability, getLeaves } from '../../services/therapists.js'
import { listRooms } from '../../services/rooms.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card, { CardHeader } from '../../components/Card.jsx'
import Badge from '../../components/Badge.jsx'
import Table from '../../components/Table.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import { formatDate } from '../../utils/date.js'

const THERAPY_COLS = [
  { key: 'name', label: 'Therapy', render: (r) => <span className="font-medium">{r.name}</span> },
  { key: 'defaultDurationMins', label: 'Default Duration', render: (r) => `${r.defaultDurationMins} min` },
  { key: 'description', label: 'Description', render: (r) => <span className="text-gray-500 text-xs">{r.description}</span> },
  { key: 'active', label: 'Status', render: (r) => <Badge label={r.active ? 'active' : 'inactive'} /> },
]

const ROOM_COLS = [
  { key: 'name', label: 'Room', render: (r) => <span className="font-medium">{r.name}</span> },
  { key: 'roomType', label: 'Type' },
  { key: 'active', label: 'Status', render: (r) => <Badge label={r.active ? 'active' : 'inactive'} /> },
]

export default function MastersPage() {
  const [therapies, setTherapies] = useState([])
  const [therapists, setTherapists] = useState([])
  const [rooms, setRooms] = useState([])
  const [therapistDetails, setTherapistDetails] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [t, th, r] = await Promise.all([listTherapies(), listTherapists(), listRooms()])
      setTherapies(t)
      setTherapists(th)
      setRooms(r)

      const details = {}
      await Promise.all(
        th.map(async (therapist) => {
          const [avail, leaves] = await Promise.all([
            getAvailability(therapist.id),
            getLeaves(therapist.id),
          ])
          details[therapist.id] = { avail, leaves }
        }),
      )
      setTherapistDetails(details)
    }
    load().finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-8">
      <PageHeader title="Masters" subtitle="Reference data for therapies, therapists, and rooms" />

      <Card>
        <CardHeader title="Therapies" subtitle={`${therapies.length} active therapies`} />
        <Table columns={THERAPY_COLS} rows={therapies} emptyMessage="No therapies configured." />
      </Card>

      <Card>
        <CardHeader title="Therapy Rooms" subtitle={`${rooms.length} rooms`} />
        <Table columns={ROOM_COLS} rows={rooms} emptyMessage="No rooms configured." />
      </Card>

      <Card>
        <CardHeader title="Therapists" subtitle={`${therapists.length} active therapists`} />
        <div className="space-y-4">
          {therapists.map((therapist) => {
            const details = therapistDetails[therapist.id] ?? { avail: [], leaves: [] }
            return (
              <div key={therapist.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{therapist.name}</p>
                    <p className="text-sm text-gray-500">{therapist.specialization}</p>
                  </div>
                  <Badge label={therapist.active ? 'active' : 'inactive'} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Weekly Availability</p>
                    {details.avail.length === 0 ? (
                      <p className="text-gray-400">Not configured</p>
                    ) : (
                      <div className="space-y-1">
                        {details.avail.map((a) => (
                          <div key={a.id} className="flex gap-2 text-gray-600">
                            <span className="w-10 font-medium text-gray-500">{a.dayOfWeek}</span>
                            <span>{a.startTime} – {a.endTime}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Upcoming Leave</p>
                    {details.leaves.length === 0 ? (
                      <p className="text-gray-400">No leaves on record</p>
                    ) : (
                      <div className="space-y-1">
                        {details.leaves.map((l) => (
                          <div key={l.id} className="text-gray-600">
                            {formatDate(l.startDate)} – {formatDate(l.endDate)}
                            {l.reason && <span className="text-gray-400 ml-1">({l.reason})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
