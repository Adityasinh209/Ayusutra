/**
 * Authentication service.
 * Phase 1: validates credentials against the seeded user list.
 * Phase 2: POST /api/auth/login → returns a JWT; all other requests carry
 *          Authorization: Bearer <token>.
 */

import { getAll } from '../mocks/store.js'
import { api, remoteReady } from './http.js'

const SESSION_KEY = 'ayursutra:session'

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function loginAs(role) {
  await delay(200)
  const user = getAll('users').find((u) => u.role === role && u.active)
  if (!user) {
    const err = new Error('Role not found.')
    err.status = 404
    throw err
  }
  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: user.roleLabel,
    ...(user.patientId ? { patientId: user.patientId } : {}),
    ...(user.therapistId ? { therapistId: user.therapistId } : {}),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
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
  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: user.roleLabel,
    ...(user.patientId ? { patientId: user.patientId } : {}),
    ...(user.therapistId ? { therapistId: user.therapistId } : {}),
  }
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

export function updateSession(patch) {
  const current = getSession() || {}
  const next = { ...current, ...patch }
  localStorage.setItem(SESSION_KEY, JSON.stringify(next))
  return next
}

/** Replace the whole clinic session (used after Clerk ↔ /api/me sync). */
export function replaceSession(next) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(next))
  return next
}

/** Load the linked clinic user from the backend after Clerk sign-in. */
export async function fetchClinicMe() {
  if (!remoteReady()) return null
  return api('/api/me')
}

export function clinicUserFromMe(me, clerkId) {
  if (!me) return null
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    role: me.role,
    roleLabel: me.roleLabel,
    ...(me.patientId ? { patientId: me.patientId } : {}),
    ...(me.therapistId ? { therapistId: me.therapistId } : {}),
    clerkId: me.clerkId || clerkId || null,
  }
}
