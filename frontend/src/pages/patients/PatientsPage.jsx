import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPatients } from '../../services/patients.js'
import PageHeader from '../../components/PageHeader.jsx'
import Button from '../../components/Button.jsx'
import Table from '../../components/Table.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import Alert from '../../components/Alert.jsx'
import { formatDate, calculateAge } from '../../utils/date.js'

const COLUMNS = [
  {
    key: 'fullName',
    label: 'Patient Name',
    render: (r) => (
      <div>
        <span className="font-bold text-stone-900 text-xs block">{r.fullName}</span>
        <span className="text-[11px] text-stone-400">{r.phone}</span>
      </div>
    ),
  },
  {
    key: 'prakriti',
    label: 'Ayurvedic Constitution',
    render: (r) => (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
        {r.prakriti || 'Vata-Pitta'}
      </span>
    ),
  },
  {
    key: 'age',
    label: 'Demographics',
    render: (r) => `${calculateAge(r.dateOfBirth)} yrs · ${r.gender}`,
  },
  {
    key: 'complaint',
    label: 'Chief Health Concern',
    render: (r) => (
      <span className="text-xs text-stone-600 line-clamp-1 max-w-xs">
        {r.chiefComplaint || r.medicalHistory || 'Under routine consultation'}
      </span>
    ),
  },
  {
    key: 'registeredAt',
    label: 'Registered',
    render: (r) => formatDate(r.registeredAt),
  },
]

export default function PatientsPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    listPatients()
      .then((data) => {
        setPatients(data)
        setFiltered(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      patients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.prakriti && p.prakriti.toLowerCase().includes(q)),
      ),
    )
  }, [search, patients])

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panchakarma Patients Directory"
        subtitle={`${patients.length} registered patient profiles with Ayurvedic constitution records`}
        action={<Button onClick={() => navigate('/patients/new')}>+ Register New Patient</Button>}
      />

      {error && <Alert message={error} className="mb-4" />}

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name, phone, or Prakriti (e.g. Vata, Pitta)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-xl border border-stone-300 px-3.5 py-2 text-xs shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
        />
      </div>

      <Table
        columns={COLUMNS}
        rows={filtered}
        onRowClick={(row) => navigate(`/patients/${row.id}`)}
        emptyMessage="No patients found matching criteria."
      />
    </div>
  )
}
