/**
 * Authentication service.
 * Phase 1: validates credentials against the seeded user list.
 * Phase 2: POST /api/auth/login → returns a JWT; all other requests carry
 *          Authorization: Bearer <token>.
 */

import { getAll } from '../mocks/store.js'

const SESSION_KEY = 'ayursutra:session'

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function login(email, password) {
  await delay()
  const users = getAll('users')
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  )
  if (!user) {
    const err = new Error('Invalid email or password.')
    err.status = 401
    throw err
  }
  const session = { id: user.id, name: user.name, email: user.email, role: user.role, roleLabel: user.roleLabel }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
