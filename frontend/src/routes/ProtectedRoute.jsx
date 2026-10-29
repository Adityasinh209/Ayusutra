import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { PageSpinner } from '../components/Spinner.jsx'
import { patientNeedsIntake } from '../services/patients.js'
import { homePathForUser } from '../auth/postAuthRedirect.js'

export default function ProtectedRoute({ children, roles }) {
  const { user, isLoaded } = useAuth()
  const location = useLocation()

  if (!isLoaded && !user) {
    return <PageSpinner />
  }

  if (!user) {
    const loginTo = location.pathname === '/intake' ? '/sign-in?intent=book' : '/sign-in'
    return <Navigate to={loginTo} state={{ from: location }} replace />
  }

  if (user.role === 'patient' && patientNeedsIntake(user) && location.pathname !== '/intake') {
    return <Navigate to="/intake" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  return children
}
