import { describe, it, expect, beforeEach } from 'vitest'
import { login, logout, getSession } from '../services/auth.js'

describe('Authentication Service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('logs in with valid doctor credentials', async () => {
    const session = await login('doctor@ayursutra.dev', 'Doctor@123')
    expect(session.role).toBe('doctor')
    expect(session.name).toBe('Dr. Meera Nair')
  })

  it('logs in with valid receptionist credentials', async () => {
    const session = await login('receptionist@ayursutra.dev', 'Reception@123')
    expect(session.role).toBe('receptionist')
  })

  it('logs in with valid admin credentials', async () => {
    const session = await login('admin@ayursutra.dev', 'Admin@123')
    expect(session.role).toBe('admin')
  })

  it('throws on invalid password', async () => {
    await expect(login('doctor@ayursutra.dev', 'wrong-password')).rejects.toThrow(
      'Invalid email or password.',
    )
  })

  it('throws on unknown email', async () => {
    await expect(login('nobody@example.com', 'anything')).rejects.toThrow(
      'Invalid email or password.',
    )
  })

  it('is case-insensitive for email', async () => {
    const session = await login('DOCTOR@AYURSUTRA.DEV', 'Doctor@123')
    expect(session.role).toBe('doctor')
  })

  it('persists session to localStorage after login', async () => {
    await login('doctor@ayursutra.dev', 'Doctor@123')
    const session = getSession()
    expect(session).not.toBeNull()
    expect(session.role).toBe('doctor')
  })

  it('clears session from localStorage on logout', async () => {
    await login('doctor@ayursutra.dev', 'Doctor@123')
    logout()
    expect(getSession()).toBeNull()
  })

  it('returns null session when not logged in', () => {
    expect(getSession()).toBeNull()
  })
})
