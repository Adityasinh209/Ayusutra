import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SignIn, useAuth as useClerkAuth } from '@clerk/react'
import { useAuth } from '../hooks/useAuth.jsx'
import { postAuthRedirect, rememberAuthIntent } from '../auth/postAuthRedirect.js'
import ClerkAuthLayout from '../layouts/ClerkAuthLayout.jsx'
import {
  fillClerkIdentifier,
  fillClerkPassword,
  isClerkContinueButton,
  isClerkPasswordStepVisible,
} from '../auth/fillClerkSignIn.js'

const DEMO_ACCOUNTS = [
  { role: 'therapist', label: 'Panchakarma Therapist', email: 'therapist@ayursutra.dev', password: 'Therapist@123' },
  { role: 'receptionist', label: 'Receptionist', email: 'receptionist@ayursutra.dev', password: 'Reception@123' },
  { role: 'patient', label: 'Patient', email: 'patient@ayursutra.dev', password: 'Patient@123' },
  { role: 'admin', label: 'Administrator', email: 'admin@ayursutra.dev', password: 'Admin@123' },
  { role: 'patient', label: 'Rahul Patel (completed)', email: 'rahul.patel@ayursutra.dev', password: 'Patient@123' },
  { role: 'patient', label: 'Priya Shah (in progress)', email: 'priya.shah@ayursutra.dev', password: 'Patient@123' },
]

export default function SignInPage() {
  const { user, login } = useAuth()
  const { isLoaded, isSignedIn } = useClerkAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const intent = searchParams.get('intent')
  const [pendingDemo, setPendingDemo] = useState(null)
  const [demoError, setDemoError] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const [passwordStepReady, setPasswordStepReady] = useState(false)

  useEffect(() => {
    rememberAuthIntent(intent)
  }, [intent])

  useEffect(() => {
    if (!user) return
    navigate(postAuthRedirect(user, { intent, demo: !!pendingDemo }), { replace: true })
  }, [user, intent, pendingDemo, navigate])

  useEffect(() => {
    if (!pendingDemo) return

    const apply = () => {
      fillClerkIdentifier(pendingDemo.email)
      const filledPassword = fillClerkPassword(pendingDemo.password)
      setPasswordStepReady(filledPassword || isClerkPasswordStepVisible())
    }

    apply()
    const root = document.querySelector('[data-clerk-component="SignIn"]') || document.body
    const observer = new MutationObserver(apply)
    observer.observe(root, { childList: true, subtree: true, attributes: true })
    const timer = window.setInterval(apply, 200)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
    }
  }, [pendingDemo])

  useEffect(() => {
    if (!pendingDemo) return
    const root = document.querySelector('[data-clerk-component="SignIn"]')
    if (!root) return

    async function completeDemoLogin() {
      if (!isClerkPasswordStepVisible() || demoLoading) return false
      setDemoLoading(true)
      setDemoError('')
      try {
        await login(pendingDemo.email, pendingDemo.password)
        navigate(postAuthRedirect({ role: pendingDemo.role }, { demo: true }), { replace: true })
        return true
      } catch (err) {
        setDemoError(err.message || 'Could not open the demo dashboard.')
        setDemoLoading(false)
        return false
      }
    }

    function onClick(event) {
      if (!isClerkContinueButton(event.target)) return
      if (!isClerkPasswordStepVisible()) return
      event.preventDefault()
      event.stopPropagation()
      void completeDemoLogin()
    }

    function onSubmit(event) {
      if (!isClerkPasswordStepVisible()) return
      event.preventDefault()
      event.stopPropagation()
      void completeDemoLogin()
    }

    root.addEventListener('click', onClick, true)
    root.addEventListener('submit', onSubmit, true)
    return () => {
      root.removeEventListener('click', onClick, true)
      root.removeEventListener('submit', onSubmit, true)
    }
  }, [pendingDemo, demoLoading, login, navigate])

  function selectDemoAccount(account) {
    setDemoError('')
    setPasswordStepReady(false)
    setPendingDemo(account)
    window.requestAnimationFrame(() => {
      fillClerkIdentifier(account.email)
    })
  }

  if (user) return null
  if (!isLoaded) return null

  return (
    <ClerkAuthLayout eyebrow="Staff & patient portal">
      {!isSignedIn && (
        <>
          {intent === 'book' && (
            <p className="w-full text-sm text-green-800/80 mb-4 text-center">
              New patient?{' '}
              <button
                type="button"
                onClick={() => navigate('/sign-up?intent=book')}
                className="font-semibold text-green-700 underline underline-offset-2 cursor-pointer"
              >
                Create an account
              </button>{' '}
              to book your consultation.
            </p>
          )}
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl={intent === 'book' ? '/sign-up?intent=book' : '/sign-up'}
            forceRedirectUrl={intent === 'book' ? '/intake' : '/dashboard'}
            fallbackRedirectUrl={intent === 'book' ? '/intake' : '/dashboard'}
          />
        </>
      )}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-4 text-sm font-medium text-green-700 cursor-pointer"
      >
        ← Back to Home
      </button>

      <div className="w-full mt-5 rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700 mb-1">Clinic demo dashboards</p>
        <p className="text-xs text-green-800/70 mb-3">
          Click a predefined account to fill the Clerk email field, then Continue — the password is filled next, and you land on that role’s dashboard.
        </p>
        {pendingDemo && (
          <p className="text-xs text-green-800 mb-3">
            Filled <span className="font-semibold">{pendingDemo.email}</span>
            {passwordStepReady ? ' and password. Click Continue to open the dashboard.' : '. Click Continue to fill the password.'}
          </p>
        )}
        {demoError && <p className="text-xs text-red-700 mb-2">{demoError}</p>}
        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              disabled={demoLoading}
              onClick={() => selectDemoAccount(account)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm cursor-pointer border ${
                pendingDemo?.email === account.email
                  ? 'border-green-400 bg-green-100'
                  : 'border-green-100 bg-green-50 hover:bg-green-100'
              } disabled:opacity-60`}
            >
              <span className="font-semibold text-green-900">{account.label}</span>
              <span className="text-xs text-green-700">{account.email}</span>
            </button>
          ))}
        </div>
      </div>
    </ClerkAuthLayout>
  )
}
