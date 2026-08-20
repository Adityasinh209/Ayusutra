import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import Card from '../components/Card.jsx'

const ROLES = [
  {
    role: 'doctor',
    label: 'View as Doctor',
    description: 'Consultations, EMR records, and patient care',
  },
  {
    role: 'receptionist',
    label: 'View as Receptionist',
    description: 'Patient registration and therapy scheduling',
  },
  {
    role: 'patient',
    label: 'View as Patient',
    description: 'Appointments and therapy history',
  },
  {
    role: 'therapist',
    label: 'View as Therapist',
    description: 'Perform assigned therapy sessions and record completion',
  },
]

export default function LoginPage() {
  const { loginAs, user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  async function handleSelect(role) {
    await loginAs(role)
    navigate('/dashboard', { replace: true })
  }

  return (
    <Card className="w-full max-w-md">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose your view</h2>
      <p className="text-sm text-gray-500 mb-6">
        Select a role to explore the AyurSutra dashboard
      </p>

      <div className="flex flex-col gap-3">
        {ROLES.map(({ role, label, description }) => (
          <button
            key={role}
            type="button"
            onClick={() => handleSelect(role)}
            className="w-full text-left rounded-lg border border-gray-200 px-4 py-3 hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer"
          >
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </button>
        ))}
      </div>
    </Card>
  )
}
