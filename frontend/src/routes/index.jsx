import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import ProtectedRoute from './ProtectedRoute.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import { PageSpinner } from '../components/Spinner.jsx'

const LoginPage = lazy(() => import('../pages/LoginPage.jsx'))
const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'))
const PatientsPage = lazy(() => import('../pages/patients/PatientsPage.jsx'))
const PatientDetailPage = lazy(() => import('../pages/patients/PatientDetailPage.jsx'))
const NewPatientPage = lazy(() => import('../pages/patients/NewPatientPage.jsx'))
const ConsultationPage = lazy(() => import('../pages/consultation/ConsultationPage.jsx'))
const SchedulingPage = lazy(() => import('../pages/scheduling/SchedulingPage.jsx'))
const AppointmentsPage = lazy(() => import('../pages/appointments/AppointmentsPage.jsx'))
const MastersPage = lazy(() => import('../pages/masters/MastersPage.jsx'))

function AuthedRoute({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route path="/dashboard" element={<AuthedRoute><DashboardPage /></AuthedRoute>} />
        <Route path="/patients" element={<AuthedRoute><PatientsPage /></AuthedRoute>} />
        <Route path="/patients/new" element={<AuthedRoute><NewPatientPage /></AuthedRoute>} />
        <Route path="/patients/:id" element={<AuthedRoute><PatientDetailPage /></AuthedRoute>} />
        <Route
          path="/consultation"
          element={<AuthedRoute roles={['doctor', 'admin']}><ConsultationPage /></AuthedRoute>}
        />
        <Route
          path="/scheduling"
          element={<AuthedRoute roles={['receptionist', 'admin']}><SchedulingPage /></AuthedRoute>}
        />
        <Route path="/appointments" element={<AuthedRoute><AppointmentsPage /></AuthedRoute>} />
        <Route
          path="/masters"
          element={<AuthedRoute roles={['admin']}><MastersPage /></AuthedRoute>}
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
