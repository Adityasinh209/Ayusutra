import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

const btnBase = 'inline-flex items-center justify-center rounded-full text-[20px] font-semibold cursor-pointer transition-all'

export default function ClerkAuthControls() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-[20px] font-medium text-green-800">{user?.name}</span>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className={`${btnBase} px-4 py-2 shadow-sm`}
          style={{ backgroundColor: '#15803d', color: '#ffffff', border: 'none' }}
        >
          Dashboard
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/login')}
      className={`${btnBase} px-5 py-2.5 shadow-sm`}
      style={{ backgroundColor: '#15803d', color: '#ffffff', border: 'none' }}
    >
      Sign in
    </button>
  )
}
