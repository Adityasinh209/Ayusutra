import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import Card from '../components/Card.jsx'

const ROLES = [
  {
    role: 'doctor',
    label: 'Doctor (Vaidya)',
    icon: '🩺',
    description: 'Ayurvedic assessment, Ashtavidha Pariksha, Panchakarma planning, and therapy prescription',
  },
  {
    role: 'receptionist',
    label: 'Receptionist / Coordinator',
    icon: '✨',
    description: 'Patient intake, smart AI therapy scheduling, room/therapist assignment, and billing',
  },
  {
    role: 'therapist',
    label: 'Panchakarma Therapist',
    icon: '✋',
    description: 'Assigned therapy sessions (Abhyanga, Basti, Shirodhara), observations, and completion records',
  },
  {
    role: 'admin',
    label: 'Center Administrator',
    icon: '🏛️',
    description: 'Panchakarma masters, therapy rooms, therapist rosters, herbal inventory, and system metrics',
  },
  {
    role: 'patient',
    label: 'Patient (Yajamana)',
    icon: '👤',
    description: 'View active Panchakarma plan, session progress, Pathya diet guidelines, and follow-ups',
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
    <Card className="w-full max-w-lg shadow-md border-stone-200">
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
          Panchakarma Clinical Suite
        </span>
        <h2 className="text-xl font-bold text-stone-900">Select Demonstration Role</h2>
        <p className="text-xs text-stone-500 mt-1">
          Explore AyurSutra through role-tailored Panchakarma clinical workflows
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {ROLES.map(({ role, label, icon, description }) => (
          <button
            key={role}
            type="button"
            onClick={() => handleSelect(role)}
            className="w-full text-left rounded-xl border border-stone-200 p-3.5 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl p-1.5 rounded-lg bg-stone-100 group-hover:bg-white transition-colors">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 group-hover:text-emerald-900">{label}</p>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}
