import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SignUp, useAuth as useClerkAuth } from '@clerk/react'
import { useAuth } from '../hooks/useAuth.jsx'
import { postAuthRedirect, rememberAuthIntent } from '../auth/postAuthRedirect.js'
import ClerkAuthLayout from '../layouts/ClerkAuthLayout.jsx'
import { PageSpinner } from '../components/Spinner.jsx'

export default function SignUpPage() {
  const { user } = useAuth()
  const { isLoaded, isSignedIn } = useClerkAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const intent = searchParams.get('intent') || 'book'

  useEffect(() => {
    rememberAuthIntent(intent)
  }, [intent])

  useEffect(() => {
    if (!user) return
    navigate(postAuthRedirect(user, { intent }), { replace: true })
  }, [user, intent, navigate])

  if (!isLoaded) return null
  if (user) return null
  if (isSignedIn) {
    return (
      <ClerkAuthLayout eyebrow="Create your AyurSutra account">
        <PageSpinner />
      </ClerkAuthLayout>
    )
  }

  return (
    <ClerkAuthLayout eyebrow="Create your AyurSutra account">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/login?intent=book"
        forceRedirectUrl="/intake"
        fallbackRedirectUrl="/intake"
      />
    <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-4 text-sm font-medium text-green-700 cursor-pointer"
      >
        ← Back to Home
      </button>
    </ClerkAuthLayout>
  )
}
