import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import TextReveal from '../components/TextReveal.jsx'

// Predefined credentials for authorized roles
const DEMO_CREDENTIALS = [
  { role: 'Panchakarma Therapist', email: 'therapist@ayursutra.dev', password: 'Therapist@123', icon: '' },
  { role: 'Receptionist', email: 'receptionist@ayursutra.dev', password: 'Reception@123', icon: '' },
  { role: 'Patient', email: 'patient@ayursutra.dev', password: 'Patient@123', icon: '' },
]

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  if (user) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email address and password.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  function fillCredential(cred) {
    setEmail(cred.email)
    setPassword(cred.password)
    setError('')
  }

  return (
    <div className="w-full max-w-md" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      {/* Card */}
      <div
        className="rounded-2xl shadow-lg overflow-hidden relative"
        style={{ backgroundColor: '#ffffff', border: '1px solid #dcfce7', fontFamily: "'Work Sans', sans-serif" }}
      >
        {/* Card header strip — 80% white / 20% green */}
        <div
          className="px-8 pt-8 pb-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 60%, #14532d 100%)' }}
        >
          <img src="/ornament-leaf.svg" alt="" className="absolute -right-8 -top-6 w-32 h-32 opacity-10 pointer-events-none" />
          <TextReveal delay={0.1} className="flex items-center gap-3 mb-4">
            <img src="/vecteezy-ayurvedic-logo.jpg" alt="Ayurvedic logo - Modern Medical and health care center" className="h-10 w-auto object-contain rounded-md shadow-sm bg-white" width="72" height="50" style={{ padding: '2px' }} />
            <div>
              <span className="block text-[16.5px] font-bold text-white">AyurSutra</span>
              <span
                className="block text-[12.5px] font-semibold uppercase tracking-widest"
                style={{ color: '#bbf7d0' }}
              >
                Panchakarma Centre
              </span>
            </div>
          </TextReveal>
          <TextReveal as="h2" delay={0.2} className="text-2xl md:text-[26px] font-bold text-white relative">
            Welcome Back
          </TextReveal>
          <TextReveal as="p" delay={0.3} className="text-[14.5px] mt-1 relative" style={{ color: 'rgba(240,253,244,0.80)' }}>
            Sign in to your clinical dashboard
          </TextReveal>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {/* Email */}
          <TextReveal delay={0.1}>
            <label className="block text-[14.5px] font-semibold mb-1.5" style={{ color: '#14532d' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-xl text-[16.5px] outline-none transition-all"
              style={{
                border: '1px solid #dcfce7',
                backgroundColor: '#ffffff',
                color: '#14532d',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#15803d')}
              onBlur={(e) => (e.target.style.borderColor = '#dcfce7')}
            />
          </TextReveal>

          {/* Password */}
          <TextReveal delay={0.2}>
            <label className="block text-[14.5px] font-semibold mb-1.5" style={{ color: '#14532d' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-xl text-[16.5px] outline-none transition-all pr-10"
                style={{
                  border: '1px solid #dcfce7',
                  backgroundColor: '#ffffff',
                  color: '#14532d',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#15803d')}
                onBlur={(e) => (e.target.style.borderColor = '#dcfce7')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[14.5px] cursor-pointer"
                style={{ color: '#16a34a' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </TextReveal>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[14.5px]"
              style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
            >
               {error}
            </div>
          )}

          {/* Submit */}
          <TextReveal delay={0.3}>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-[16.5px] font-semibold transition-all cursor-pointer shadow-sm"
              style={{
                backgroundColor: loading ? '#86efac' : '#15803d',
                color: loading ? '#14532d' : '#ffffff',
                border: 'none',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </TextReveal>

          {/* Back to home */}
          <TextReveal delay={0.4}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2 text-[14.5px] font-medium transition-all cursor-pointer"
              style={{ color: '#16a34a', backgroundColor: 'transparent', border: 'none' }}
            >
              ← Back to Home
            </button>
          </TextReveal>
        </form>

        {/* Predefined demo credentials */}
        <div
          className="px-8 pb-6"
          style={{ borderTop: '1px solid #dcfce7' }}
        >
          <TextReveal as="p" delay={0.1} className="text-[13.5px] font-semibold uppercase tracking-wider pt-4 mb-3" style={{ color: '#16a34a' }}>
            Authorized User Accounts
          </TextReveal>
          <div className="space-y-2">
            {DEMO_CREDENTIALS.map((c, idx) => (
              <TextReveal key={c.role} staggerIndex={idx} staggerStep={0.06}>
                <button
                  type="button"
                  onClick={() => fillCredential(c)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14.5px] transition-all cursor-pointer text-left hover:border-green-300 hover:bg-green-50"
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    color: '#14532d',
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span>{c.icon}</span>
                    <span className="font-semibold">{c.role}</span>
                  </span>
                  <span style={{ color: '#16a34a' }}>{c.email}</span>
                </button>
              </TextReveal>
            ))}
          </div>
          <TextReveal as="p" delay={0.4} className="text-[13px] sm:text-sm mt-2 text-center font-medium" style={{ color: '#15803d' }}>
            Click an account above to auto-fill email &amp; password
          </TextReveal>
        </div>
      </div>
    </div>
  )
}
