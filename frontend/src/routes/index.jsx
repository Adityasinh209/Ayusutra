import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import ProtectedRoute from './ProtectedRoute.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import { PageSpinner } from '../components/Spinner.jsx'

const LandingPage = lazy(() => import('../pages/LandingPage.jsx'))
const SignInPage = lazy(() => import('../pages/SignInPage.jsx'))
const SignUpPage = lazy(() => import('../pages/SignUpPage.jsx'))
const PatientIntakePage = lazy(() => import('../pages/PatientIntakePage.jsx'))
const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'))
const PatientsPage = lazy(() => import('../pages/patients/PatientsPage.jsx'))
const PatientDetailPage = lazy(() => import('../pages/patients/PatientDetailPage.jsx'))
const NewPatientPage = lazy(() => import('../pages/patients/NewPatientPage.jsx'))
const ConsultationPage = lazy(() => import('../pages/consultation/ConsultationPage.jsx'))
const PlansPage = lazy(() => import('../pages/plans/PlansPage.jsx'))
const SchedulingPage = lazy(() => import('../pages/scheduling/SchedulingPage.jsx'))
const AppointmentsPage = lazy(() => import('../pages/appointments/AppointmentsPage.jsx'))
const TherapistSessionsPage = lazy(() => import('../pages/therapist/TherapistSessionsPage.jsx'))
const TherapistProfileSetupPage = lazy(() => import('../pages/therapist/TherapistProfileSetupPage.jsx'))
const MastersPage = lazy(() => import('../pages/masters/MastersPage.jsx'))
const InventoryPage = lazy(() => import('../pages/inventory/InventoryPage.jsx'))
const BillingPage = lazy(() => import('../pages/billing/BillingPage.jsx'))
const FollowupsPage = lazy(() => import('../pages/followups/FollowupsPage.jsx'))
const StaffRegistrationPage = lazy(() => import('../pages/staff/StaffRegistrationPage.jsx'))
const AssistantPage = lazy(() => import('../pages/assistant/AssistantPage.jsx'))

function LegacyLoginRedirect() {
  const location = useLocation()
  return <Navigate to={`/sign-in${location.search}`} replace />
}

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
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth — Clerk sign-in; /login redirects for old links */}
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/login" element={<LegacyLoginRedirect />} />
        <Route path="/login/*" element={<LegacyLoginRedirect />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/select-role" element={<Navigate to="/sign-in" replace />} />
        <Route
          path="/intake"
          element={(
            <ProtectedRoute>
              <PatientIntakePage />
            </ProtectedRoute>
          )}
        />

        <Route path="/dashboard" element={<AuthedRoute><DashboardPage /></AuthedRoute>} />
        <Route
          path="/patients"
          element={<AuthedRoute roles={['doctor', 'therapist', 'receptionist', 'admin']}><PatientsPage /></AuthedRoute>}
        />
        <Route
          path="/patients/new"
          element={<AuthedRoute roles={['doctor', 'therapist', 'receptionist', 'admin']}><NewPatientPage /></AuthedRoute>}
        />
        <Route path="/patients/:id" element={<AuthedRoute><PatientDetailPage /></AuthedRoute>} />

        {/* Clinical Panchakarma Assessment & Planning */}
        <Route
          path="/consultation"
          element={<AuthedRoute roles={['doctor', 'therapist', 'admin']}><ConsultationPage /></AuthedRoute>}
        />
        <Route
          path="/plans"
          element={<AuthedRoute roles={['doctor', 'therapist', 'admin', 'receptionist']}><PlansPage /></AuthedRoute>}
        />

        {/* Smart Scheduling */}
        <Route
          path="/scheduling"
          element={<AuthedRoute roles={['receptionist', 'admin', 'doctor', 'patient']}><SchedulingPage /></AuthedRoute>}
        />

        {/* Therapy Sessions & Execution */}
        <Route path="/appointments" element={<AuthedRoute><AppointmentsPage /></AuthedRoute>} />
        <Route
          path="/therapist/sessions"
          element={<AuthedRoute roles={['therapist', 'admin', 'doctor']}><TherapistSessionsPage /></AuthedRoute>}
        />
        <Route
          path="/therapist/profile"
          element={<AuthedRoute roles={['therapist', 'admin', 'doctor']}><TherapistProfileSetupPage /></AuthedRoute>}
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
          element={<AuthedRoute roles={['doctor', 'therapist', 'admin', 'receptionist']}><FollowupsPage /></AuthedRoute>}
        />
        <Route
          path="/staff/register"
          element={<AuthedRoute roles={['admin']}><StaffRegistrationPage /></AuthedRoute>}
        />
        <Route
          path="/assistant"
          element={<AuthedRoute roles={['patient', 'admin']}><AssistantPage /></AuthedRoute>}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
