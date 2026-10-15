import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. Copy frontend/.env.example to frontend/.env.local and add your Clerk publishable key.',
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInUrl="/login"
      signUpUrl="/sign-up"
      appearance={{
        variables: { colorPrimary: '#15803d' },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
