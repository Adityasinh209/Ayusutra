import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import Badge from '../components/Badge.jsx'

const NAV_BY_ROLE = {
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/patients', label: 'Patients' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/masters', label: 'Masters' },
  ],
  doctor: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/patients', label: 'Patients' },
    { to: '/consultation', label: 'Consultation' },
    { to: '/appointments', label: 'Appointments' },
  ],
  receptionist: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/patients', label: 'Patients' },
    { to: '/scheduling', label: 'Scheduling' },
    { to: '/appointments', label: 'Appointments' },
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <span className="h-7 w-7 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">A</span>
          <span className="font-semibold text-gray-900 text-sm">AyurSutra</span>
        </div>
        <nav className="flex-1 py-4 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium mb-0.5 transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-800 truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 mb-3">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-red-600 hover:text-red-700 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (mobile + user info) */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between">
          <button
            className="lg:hidden p-1 text-gray-500 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-sm text-gray-600">Welcome, <span className="font-medium text-gray-900">{user?.name}</span></span>
            <Badge label={user?.roleLabel} color={user?.role} />
          </div>
          <div className="flex lg:hidden items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">AyurSutra</span>
          </div>
          <button
            onClick={handleLogout}
            className="lg:hidden text-sm text-red-600 hover:text-red-700 cursor-pointer"
          >
            Sign out
          </button>
        </header>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="lg:hidden bg-white border-b border-gray-200 px-4 py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block py-2 text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-600'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <main className="flex-1 px-4 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  )
}
