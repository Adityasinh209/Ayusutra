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
  { key: 'fullName', label: 'Name', render: (r) => <span className="font-medium text-gray-900">{r.fullName}</span> },
  { key: 'age', label: 'Age / Gender', render: (r) => `${calculateAge(r.dateOfBirth)} yrs · ${r.gender}` },
  { key: 'phone', label: 'Phone' },
  { key: 'registeredAt', label: 'Registered', render: (r) => formatDate(r.registeredAt) },
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
      .then((data) => { setPatients(data); setFiltered(data) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(patients.filter((p) => p.fullName.toLowerCase().includes(q) || p.phone.includes(q)))
  }, [search, patients])

  if (loading) return <PageSpinner />

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} registered patient${patients.length !== 1 ? 's' : ''}`}
        action={<Button onClick={() => navigate('/patients/new')}>+ Register Patient</Button>}
      />

      {error && <Alert message={error} className="mb-4" />}

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <Table
        columns={COLUMNS}
        rows={filtered}
        onRowClick={(row) => navigate(`/patients/${row.id}`)}
        emptyMessage="No patients found. Register the first patient to get started."
      />
    </div>
  )
}
