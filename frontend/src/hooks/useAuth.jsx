import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/react'
import { login as loginService, loginAs as loginAsService, logout as logoutService, getSession, updateSession } from '../services/auth.js'
import { mapClerkUserToClinicUser } from '../auth/mapClerkUser.js'
import { setApiToken } from '../services/http.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser()
  const { getToken } = useClerkAuth()
  const { signOut } = useClerk()

  useEffect(() => {
    if (!isSignedIn) {
      setApiToken('')
      return
    }
    getToken().then((value) => setApiToken(value || '')).catch(() => setApiToken(''))
  }, [isSignedIn, clerkUser, getToken])
  const [sessionUser, setSessionUser] = useState(() => getSession())

  const clerkMapped = useMemo(() => {
    if (!isSignedIn || !clerkUser) return null
    return mapClerkUserToClinicUser(clerkUser)
  }, [isSignedIn, clerkUser])

  const user = sessionUser || clerkMapped

  const login = useCallback(async (email, password) => {
    const session = await loginService(email, password)
    setSessionUser(session)
    return session
  }, [])

  const loginAs = useCallback(async (role) => {
    const session = await loginAsService(role)
    setSessionUser(session)
    return session
  }, [])

  const logout = useCallback(async () => {
    logoutService()
    setSessionUser(null)
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
        isLoaded: clerkLoaded || !!sessionUser,
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
