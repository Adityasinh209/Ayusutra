import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { listPatients } from '../services/patients.js'
import { listAppointments } from '../services/appointments.js'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { PageSpinner } from '../components/Spinner.jsx'
import { formatDate, formatTime } from '../utils/date.js'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentAppointments, setRecentAppointments] = useState([])

  useEffect(() => {
    async function load() {
      const [patients, appointments] = await Promise.all([listPatients(), listAppointments()])
      const today = new Date().toISOString().slice(0, 10)
      setStats({
        totalPatients: patients.length,
        todayAppointments: appointments.filter((a) => a.date === today).length,
        scheduled: appointments.filter((a) => a.status === 'Scheduled').length,
        confirmed: appointments.filter((a) => a.status === 'Confirmed').length,
      })
      setRecentAppointments(appointments.slice(0, 5))
    }
    load()
  }, [])

  if (!stats) return <PageSpinner />

  const greeting =
    user.role === 'doctor'
      ? 'Patient consultations and EMR updates are accessible from the sidebar.'
      : user.role === 'receptionist'
      ? 'Schedule therapy appointments from the Scheduling section.'
      : 'View your upcoming appointments and therapy history.'

  const quickLinks =
    user.role === 'doctor'
      ? [
          { label: 'New Consultation', to: '/consultation' },
          { label: 'View Patients', to: '/patients' },
        ]
      : user.role === 'receptionist'
      ? [
          { label: 'Register Patient', to: '/patients/new' },
          { label: 'Schedule Therapy', to: '/scheduling' },
        ]
      : [
          { label: 'My Appointments', to: '/appointments' },
          { label: 'View My Profile', to: `/patients/${user.patientId ?? 'patient-1'}` },
        ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Good morning, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500 mt-1">{greeting}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Patients" value={stats.totalPatients} />
        <StatCard label="Today's Appointments" value={stats.todayAppointments} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="Confirmed" value={stats.confirmed} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Appointments</h2>
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-gray-400">No appointments yet.</p>
            ) : (
              <div className="space-y-3">
                {recentAppointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{formatDate(a.date)}</p>
                      <p className="text-xs text-gray-400">{formatTime(a.startTime)} – {formatTime(a.endTime)}</p>
                    </div>
                    <Badge label={a.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {quickLinks.map((l) => (
                <Button key={l.to} variant="secondary" size="sm" onClick={() => navigate(l.to)}>
                  {l.label}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <Card>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </Card>
  )
}
