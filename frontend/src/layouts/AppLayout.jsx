import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import Badge from '../components/Badge.jsx'

const NAV_BY_ROLE = {
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/patients', label: 'Patients' },
    { to: '/plans', label: 'Panchakarma Plans' },
    { to: '/appointments', label: 'Therapy Sessions' },
    { to: '/scheduling', label: 'Smart Scheduling' },
    { to: '/masters', label: 'Panchakarma Masters' },
    { to: '/inventory', label: 'Herbal Inventory' },
    { to: '/billing', label: 'Treatment Billing' },
    { to: '/followups', label: 'Follow-up Tracking' },
    { to: '/assistant', label: 'AyurSutra Assistant' },
  ],
  doctor: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/patients', label: 'Patients' },
    { to: '/consultation', label: 'Ayurvedic Assessment' },
    { to: '/plans', label: 'Panchakarma Plans' },
    { to: '/appointments', label: 'Therapy Sessions' },
    { to: '/followups', label: 'Follow-up Tracking' },
  ],
  receptionist: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/patients', label: 'Patients' },
    { to: '/scheduling', label: 'Smart Scheduling' },
    { to: '/appointments', label: 'Therapy Sessions' },
    { to: '/billing', label: 'Treatment Billing' },
  ],
  therapist: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/therapist/sessions', label: 'Assigned Sessions' },
    // { to: '/inventory', label: 'Therapy Consumables' },
  ],
  patient: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/appointments', label: 'My Therapy Sessions' },
    { to: '/assistant', label: 'AyurSutra Assistant' },
  ],
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = user?.role === 'patient'
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: `/patients/${user?.patientId || 'patient-1'}`, label: 'My Treatment Plan' },
        { to: '/appointments', label: 'My Therapy Sessions' },
        { to: '/assistant', label: 'AyurSutra Assistant' },
      ]
    : NAV_BY_ROLE[user?.role] ?? []
  const canUseAssistant = user?.role === 'patient' || user?.role === 'admin'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Role-based badge colors using new theme
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'badge-green'
      case 'doctor': return 'badge-sage'
      case 'receptionist': return 'badge-amber'
      case 'therapist': return 'badge-emerald'
      case 'patient': return 'bg-green-100 text-green-800'
      default: return 'bg-warm-100 text-warm-700'
    }
  }

  return (
    <div className="min-h-screen flex bg-warm-50 text-warm-800">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-warm-200 shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-warm-200">
          <img src="/vecteezy-ayurvedic-logo.jpg" alt="Ayurvedic logo - Modern Medical and health care center" className="h-9 w-auto object-contain rounded-md shadow-sm bg-white border border-green-100" width="64" height="44" />
          <div>
            <span className="font-bold text-base tracking-tight block leading-tight text-warm-900 font-serif">
              AyurSutra
            </span>
            <span className="text-[9.5px] font-semibold tracking-wider uppercase block text-green-600">
              Panchakarma Center
            </span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-xl text-xs transition-all flex items-center ${
                  isActive
                    ? 'font-bold shadow-sm bg-green-50 border border-green-200 text-green-800'
                    : 'text-warm-600 hover:bg-green-50 hover:text-green-700'
                }`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-warm-200 bg-warm-50">
          <p className="text-xs font-bold truncate text-warm-900">{user?.name}</p>
          <p className="text-[10.5px] mb-2 truncate text-warm-500">{user?.email}</p>
          <div className="flex items-center justify-between">
            <Badge label={user?.roleLabel || user?.role} className={getRoleBadgeClass(user?.role)} />
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-warm-500 hover:text-green-700 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-warm-200 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 cursor-pointer rounded-lg hover:bg-green-50 text-green-700 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden lg:flex items-center gap-3">
              <span className="text-xs text-warm-500">Welcome,</span>
              <span className="text-sm font-semibold text-warm-900">{user?.name}</span>
              <span className="text-[10.5px] px-2.5 py-0.5 rounded-full font-medium border border-green-200 bg-green-50 text-green-700">
                {user?.roleLabel || user?.role}
              </span>
            </div>
            <div className="flex lg:hidden items-center gap-2">
              <img src="/vecteezy-ayurvedic-logo.jpg" alt="Ayurvedic logo" className="h-7 w-auto object-contain rounded-md shadow-sm bg-white border border-green-100" width="48" height="33" />
              <span className="text-base font-bold text-warm-900 font-serif">AyurSutra</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canUseAssistant && (
              <button
                onClick={() => navigate('/assistant')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border cursor-pointer transition-all shadow-sm
                           bg-green-50 border-green-200 text-green-700
                           hover:bg-green-100 hover:border-green-300"
              >
                AyurSutra Assistant
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-warm-500 hover:text-green-700 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <nav className="lg:hidden bg-white border-b border-warm-200 px-4 py-3 space-y-1 shadow-lg">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium flex items-center ${
                    isActive
                      ? 'font-bold bg-green-50 text-green-800'
                      : 'text-warm-600 hover:bg-green-50 hover:text-green-700'
                  }`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        <main className="flex-1 px-4 lg:px-8 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}