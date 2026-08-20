import { createContext, useContext, useState, useCallback } from 'react'
import { login as loginService, loginAs as loginAsService, logout as logoutService, getSession } from '../services/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession())

  const login = useCallback(async (email, password) => {
    const session = await loginService(email, password)
    setUser(session)
    return session
  }, [])

  const loginAs = useCallback(async (role) => {
    const session = await loginAsService(role)
    setUser(session)
    return session
  }, [])

  const logout = useCallback(() => {
    logoutService()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, loginAs, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
