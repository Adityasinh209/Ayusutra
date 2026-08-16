import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import Card from '../components/Card.jsx'
import FormField, { Input } from '../components/FormField.jsx'
import Button from '../components/Button.jsx'
import Alert from '../components/Alert.jsx'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})

  if (user) {
    const from = location.state?.from?.pathname ?? '/dashboard'
    navigate(from, { replace: true })
    return null
  }

  function validate() {
    const e = {}
    if (!email.trim()) e.email = 'Email is required.'
    if (!password) e.password = 'Password is required.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setError(null)
    setLoading(true)
    try {
      const session = await login(email, password)
      const from = location.state?.from?.pathname ?? '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h2>
      <p className="text-sm text-gray-500 mb-6">Access the AyurSutra management system</p>

      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Email address" error={errors.email} required>
          <Input
            type="email"
            placeholder="you@ayursutra.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
        </FormField>
        <FormField label="Password" error={errors.password} required>
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />
        </FormField>
        <Button type="submit" loading={loading} className="mt-1">
          Sign in
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-500 mb-2">Demo credentials</p>
        <p>Doctor: doctor@ayursutra.dev / Doctor@123</p>
        <p>Receptionist: receptionist@ayursutra.dev / Reception@123</p>
        <p>Admin: admin@ayursutra.dev / Admin@123</p>
      </div>
    </Card>
  )
}
