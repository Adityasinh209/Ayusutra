import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/react'
import {
  login as loginService,
  loginAs as loginAsService,
  logout as logoutService,
  getSession,
  updateSession,
  replaceSession,
  fetchClinicMe,
  clinicUserFromMe,
} from '../services/auth.js'
import { mapClerkUserToClinicUser } from '../auth/mapClerkUser.js'
import { setApiToken, setApiTokenGetter, hasApiToken } from '../services/http.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser()
  const { getToken } = useClerkAuth()
  const { signOut } = useClerk()
  const [sessionUser, setSessionUser] = useState(() => getSession())
  const [clinicSynced, setClinicSynced] = useState(() => !isSignedIn)

  useEffect(() => {
    if (!isSignedIn) {
      setApiToken('')
      setApiTokenGetter(async () => '')
      return
    }
    setApiTokenGetter(async () => {
      try {
        return (await getToken({ skipCache: true })) || ''
      } catch {
        try {
          return (await getToken()) || ''
        } catch {
          return ''
        }
      }
    })
    getToken({ skipCache: true }).then((value) => setApiToken(value || '')).catch(() => setApiToken(''))
  }, [isSignedIn, clerkUser, getToken])

  const clerkMapped = useMemo(() => {
    if (!isSignedIn || !clerkUser) return null
    return mapClerkUserToClinicUser(clerkUser)
  }, [isSignedIn, clerkUser])

  useEffect(() => {
    if (!clerkLoaded) return
    if (!isSignedIn || !clerkUser) {
      setClinicSynced(true)
      return
    }

    let cancelled = false
    setClinicSynced(false)

    async function syncClinicProfile() {
      const apiUrl = (import.meta.env.VITE_API_URL || '').trim()
      if (!apiUrl) {
        const mapped = mapClerkUserToClinicUser(clerkUser)
        if (!cancelled && mapped) {
          setSessionUser(replaceSession({ ...mapped, clerkId: clerkUser.id }))
        }
        if (!cancelled) setClinicSynced(true)
        return
      }

      for (let attempt = 0; attempt < 8 && !hasApiToken(); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 150))
        if (cancelled) return
      }

      try {
        const me = await fetchClinicMe()
        if (cancelled) return
        const clinicUser = clinicUserFromMe(me, clerkUser.id)
        if (clinicUser) setSessionUser(replaceSession(clinicUser))
      } catch {
        if (cancelled) return
        const mapped = mapClerkUserToClinicUser(clerkUser)
        if (mapped) setSessionUser(replaceSession({ ...mapped, clerkId: clerkUser.id }))
      } finally {
        if (!cancelled) setClinicSynced(true)
      }
    }

    syncClinicProfile()
    return () => {
      cancelled = true
    }
  }, [clerkLoaded, isSignedIn, clerkUser])

  const user = isSignedIn ? (sessionUser || clerkMapped) : sessionUser

  const login = useCallback(async (email, password) => {
    const session = await loginService(email, password)
    setSessionUser(session)
    setClinicSynced(true)
    return session
  }, [])

  const loginAs = useCallback(async (role) => {
    const session = await loginAsService(role)
    setSessionUser(session)
    setClinicSynced(true)
    return session
  }, [])

  const logout = useCallback(async () => {
    logoutService()
    setSessionUser(null)
    setClinicSynced(true)
    if (isSignedIn) {
      await signOut({ redirectUrl: '/' })
    }
  }, [isSignedIn, signOut])

  const updateUser = useCallback((patch) => {
    setSessionUser((prev) => {
      const base = prev || clerkMapped || getSession() || {}
      return updateSession({ ...base, ...patch })
    })
  }, [clerkMapped])

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginAs,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isLoaded: clerkLoaded && clinicSynced,
        isClerkSignedIn: !!isSignedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
