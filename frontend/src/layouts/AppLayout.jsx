import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import Badge from '../components/Badge.jsx'

const NAV_BY_ROLE = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/patients', label: 'Patients', icon: '👥' },
    { to: '/plans', label: 'Panchakarma Plans', icon: '🌿' },
    { to: '/appointments', label: 'Therapy Sessions', icon: '⏳' },
    { to: '/scheduling', label: 'Smart Scheduling', icon: '✨' },
    { to: '/masters', label: 'Panchakarma Masters', icon: '🏛️' },
    { to: '/inventory', label: 'Herbal Inventory', icon: '🧪' },
    { to: '/billing', label: 'Treatment Billing', icon: '💳' },
    { to: '/followups', label: 'Follow-up Tracking', icon: '📋' },
    { to: '/assistant', label: 'AyurSutra Assistant', icon: '🤖' },
  ],
  doctor: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/patients', label: 'Patients', icon: '👥' },
    { to: '/consultation', label: 'Ayurvedic Assessment', icon: '🩺' },
    { to: '/plans', label: 'Panchakarma Plans', icon: '🌿' },
    { to: '/appointments', label: 'Therapy Sessions', icon: '⏳' },
    { to: '/followups', label: 'Follow-up Tracking', icon: '📋' },
    { to: '/assistant', label: 'AyurSutra Assistant', icon: '🤖' },
  ],
  receptionist: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/patients', label: 'Patients', icon: '👥' },
    { to: '/scheduling', label: 'Smart Scheduling', icon: '✨' },
    { to: '/appointments', label: 'Therapy Sessions', icon: '⏳' },
    { to: '/billing', label: 'Treatment Billing', icon: '💳' },
    { to: '/assistant', label: 'AyurSutra Assistant', icon: '🤖' },
  ],
  therapist: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/therapist/sessions', label: 'Assigned Sessions', icon: '✋' },
    { to: '/inventory', label: 'Therapy Consumables', icon: '🧪' },
    { to: '/assistant', label: 'AyurSutra Assistant', icon: '🤖' },
  ],
  patient: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/appointments', label: 'My Therapy Sessions', icon: '⏳' },
    { to: '/assistant', label: 'AyurSutra Assistant', icon: '🤖' },
  ],
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = NAV_BY_ROLE[user?.role] ?? []

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-stone-200 shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-stone-100">
          <span className="h-9 w-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-sm">
            ॐ
          </span>
          <div>
            <span className="font-bold text-stone-900 text-sm tracking-tight block">AyurSutra</span>
            <span className="text-[10px] text-emerald-700 font-semibold tracking-wider uppercase block">Panchakarma Center</span>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs border border-emerald-100'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`
              }
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-stone-100 bg-stone-50/60">
          <p className="text-xs font-semibold text-stone-800 truncate">{user?.name}</p>
          <p className="text-[11px] text-stone-500 mb-2 truncate">{user?.email}</p>
          <div className="flex items-center justify-between">
            <Badge label={user?.roleLabel || user?.role} color={user?.role} />
            <button
              onClick={handleLogout}
              className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-stone-200 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 text-stone-500 hover:text-stone-700 cursor-pointer rounded-md hover:bg-stone-100"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden lg:flex items-center gap-3">
              <span className="text-xs text-stone-500">Welcome,</span>
              <span className="text-sm font-semibold text-stone-900">{user?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                {user?.roleLabel || user?.role}
              </span>
            </div>
            <div className="flex lg:hidden items-center gap-2">
              <span className="h-6 w-6 rounded bg-emerald-700 flex items-center justify-center text-white text-xs font-bold">ॐ</span>
              <span className="text-sm font-bold text-stone-900">AyurSutra</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/assistant')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-full border border-emerald-200 cursor-pointer transition-colors"
            >
              <span>🤖</span> AyurSutra Assistant
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-stone-600 hover:text-red-600 font-medium cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <nav className="lg:hidden bg-white border-b border-stone-200 px-4 py-3 space-y-1 shadow-lg">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-stone-600 hover:bg-stone-50'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        <main className="flex-1 px-4 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  )
}
