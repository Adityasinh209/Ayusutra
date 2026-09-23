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
  {
    key: 'name',
    label: 'Procedure / Therapy',
    render: (r) => (
      <div>
        <span className="font-bold text-stone-900 block">{r.name}</span>
        <span className="text-[10.5px] text-stone-500 line-clamp-1">{r.description}</span>
      </div>
    ),
  },
  {
    key: 'category',
    label: 'Classification',
    render: (r) => (
      <div>
        <span
          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full inline-block ${
            r.category === 'Panchakarma Procedure'
              ? 'bg-amber-100 text-amber-900 border border-amber-200'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
          }`}
        >
          {r.category || 'Therapy'}
        </span>
        <span className="text-[9.5px] text-stone-500 block mt-0.5">{r.stage || 'Purva Karma'}</span>
      </div>
    ),
  },
  {
    key: 'defaultDurationMins',
    label: 'Duration & Sessions',
    render: (r) => (
      <div className="text-xs text-stone-700">
        <span className="font-semibold">{r.defaultDurationMins} min</span>
        <span className="text-stone-400 block text-[9.5px]">{r.defaultSessionCount || 7} sessions</span>
      </div>
    ),
  },
  {
    key: 'requiredRoomType',
    label: 'Required Facility Room',
    render: (r) => (
      <span className="text-xs font-medium text-stone-800 bg-stone-100 px-2 py-1 rounded">
        {r.requiredRoomType || 'General Therapy Room'}
      </span>
    ),
  },
  {
    key: 'requiredTherapistSpecialization',
    label: 'Therapist Specialization',
    render: (r) => (
      <span className="text-xs font-semibold text-emerald-800">
        {r.requiredTherapistSpecialization || r.name}
      </span>
    ),
  },
  {
    key: 'protocols',
    label: 'Clinical Instructions',
    render: (r) => (
      <div className="text-[10.5px] text-stone-600 max-w-xs space-y-1">
        {r.preparationRequirements && (
          <p><strong className="text-stone-700">Prep:</strong> {r.preparationRequirements}</p>
        )}
        {r.postTreatmentInstructions && (
          <p><strong className="text-stone-700">Post:</strong> {r.postTreatmentInstructions}</p>
        )}
      </div>
    ),
  },
  {
    key: 'active',
    label: 'Status',
    render: (r) => <Badge label={r.active ? 'Active' : 'Inactive'} />,
  },
]

const ROOM_COLS = [
  {
    key: 'name',
    label: 'Room / Shala',
    render: (r) => <span className="font-bold text-stone-900">{r.name}</span>,
  },
  {
    key: 'roomType',
    label: 'Panchakarma Facility Type',
    render: (r) => (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
        {r.roomType}
      </span>
    ),
  },
  {
    key: 'equipment',
    label: 'Specialized Ayurvedic Equipment',
    render: (r) => (
      <span className="text-xs text-stone-600">{r.equipment || 'Standard therapy table and warm water basin'}</span>
    ),
  },
  {
    key: 'active',
    label: 'Status',
    render: (r) => <Badge label={r.active ? 'Operational' : 'Maintenance'} />,
  },
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
      <PageHeader
        title="Panchakarma Clinical Masters"
        subtitle="Reference directory of classical procedures, specialized therapy rooms, and certified therapists"
      />

      {/* 1. Therapies Master */}
      <Card>
        <CardHeader
          title="Panchakarma Procedures &amp; Supportive Therapies"
          subtitle={`${therapies.length} standardized protocols with facility and specialization requirements`}
        />
        <Table columns={THERAPY_COLS} rows={therapies} emptyMessage="No therapies configured." />
      </Card>

      {/* 2. Therapy Rooms Master */}
      <Card>
        <CardHeader
          title="Panchakarma Therapy Rooms (Shalas &amp; Kutirs)"
          subtitle={`${rooms.length} dedicated procedural chambers`}
        />
        <Table columns={ROOM_COLS} rows={rooms} emptyMessage="No rooms configured." />
      </Card>

      {/* 3. Therapists Master */}
      <Card>
        <CardHeader
          title="Certified Panchakarma Therapists Roster"
          subtitle={`${therapists.length} active practitioners with certified procedure specializations`}
        />
        <div className="grid gap-4">
          {therapists.map((therapist) => {
            const details = therapistDetails[therapist.id] ?? { avail: [], leaves: [] }
            const specs = therapist.specializations || [therapist.specialization]

            return (
              <div key={therapist.id} className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{therapist.name}</span>
                      <span className="text-xs text-stone-400">({therapist.gender || 'Practitioner'})</span>
                      <Badge label={therapist.active ? 'Active Roster' : 'Inactive'} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {specs.map((s) => (
                        <span
                          key={s}
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900"
                        >
                           {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-xs text-stone-500">
                    <span>Shift: {therapist.workStartTime} – {therapist.workEndTime}</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-stone-200/60">
                  <div>
                    <p className="text-[10.5px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                      Weekly Schedule
                    </p>
                    {details.avail.length === 0 ? (
                      <p className="text-stone-400">Schedule standard across assigned working days</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {details.avail.map((a) => (
                          <span
                            key={a.id}
                            className="bg-white border border-stone-200 px-2 py-1 rounded text-stone-700"
                          >
                            <span className="font-semibold text-emerald-800">{a.dayOfWeek}: </span>
                            {a.startTime}–{a.endTime}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[10.5px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                      Leave Records &amp; Off-Duty Status
                    </p>
                    {details.leaves.length === 0 ? (
                      <p className="text-stone-400">No scheduled leaves on record</p>
                    ) : (
                      <div className="space-y-1">
                        {details.leaves.map((l) => (
                          <div key={l.id} className="text-stone-700 bg-amber-50/70 border border-amber-200 p-1.5 rounded">
                            <span className="font-semibold">{formatDate(l.startDate)}</span> to{' '}
                            <span className="font-semibold">{formatDate(l.endDate)}</span>
                            {l.reason && <span className="text-stone-500 ml-1">({l.reason})</span>}
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
