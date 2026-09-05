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
const PlansPage = lazy(() => import('../pages/plans/PlansPage.jsx'))
const SchedulingPage = lazy(() => import('../pages/scheduling/SchedulingPage.jsx'))
const AppointmentsPage = lazy(() => import('../pages/appointments/AppointmentsPage.jsx'))
const TherapistSessionsPage = lazy(() => import('../pages/therapist/TherapistSessionsPage.jsx'))
const MastersPage = lazy(() => import('../pages/masters/MastersPage.jsx'))
const InventoryPage = lazy(() => import('../pages/inventory/InventoryPage.jsx'))
const BillingPage = lazy(() => import('../pages/billing/BillingPage.jsx'))
const FollowupsPage = lazy(() => import('../pages/followups/FollowupsPage.jsx'))
const AssistantPage = lazy(() => import('../pages/assistant/AssistantPage.jsx'))

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
        <Route
          path="/patients"
          element={<AuthedRoute roles={['doctor', 'receptionist', 'admin']}><PatientsPage /></AuthedRoute>}
        />
        <Route
          path="/patients/new"
          element={<AuthedRoute roles={['doctor', 'receptionist', 'admin']}><NewPatientPage /></AuthedRoute>}
        />
        <Route path="/patients/:id" element={<AuthedRoute><PatientDetailPage /></AuthedRoute>} />

        {/* Clinical Panchakarma Assessment & Planning */}
        <Route
          path="/consultation"
          element={<AuthedRoute roles={['doctor', 'admin']}><ConsultationPage /></AuthedRoute>}
        />
        <Route
          path="/plans"
          element={<AuthedRoute roles={['doctor', 'admin', 'receptionist']}><PlansPage /></AuthedRoute>}
        />

        {/* Smart Scheduling */}
        <Route
          path="/scheduling"
          element={<AuthedRoute roles={['receptionist', 'admin', 'doctor']}><SchedulingPage /></AuthedRoute>}
        />

        {/* Therapy Sessions & Execution */}
        <Route path="/appointments" element={<AuthedRoute><AppointmentsPage /></AuthedRoute>} />
        <Route
          path="/therapist/sessions"
          element={<AuthedRoute roles={['therapist', 'admin', 'doctor']}><TherapistSessionsPage /></AuthedRoute>}
        />

        {/* Clinical Masters, Inventory & Billing */}
        <Route
          path="/masters"
          element={<AuthedRoute roles={['admin', 'doctor']}><MastersPage /></AuthedRoute>}
        />
        <Route
          path="/inventory"
          element={<AuthedRoute roles={['admin', 'therapist', 'doctor', 'receptionist']}><InventoryPage /></AuthedRoute>}
        />
        <Route
          path="/billing"
          element={<AuthedRoute roles={['receptionist', 'admin']}><BillingPage /></AuthedRoute>}
        />
        <Route
          path="/followups"
          element={<AuthedRoute roles={['doctor', 'admin']}><FollowupsPage /></AuthedRoute>}
        />
        <Route
          path="/assistant"
          element={<AuthedRoute><AssistantPage /></AuthedRoute>}
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
