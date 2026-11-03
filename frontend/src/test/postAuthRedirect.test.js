import { describe, it, expect, beforeEach } from 'vitest'
import { postAuthRedirect, rememberAuthIntent, clearAuthIntent, rememberReturnTo, clearReturnTo } from '../auth/postAuthRedirect.js'

describe('postAuthRedirect', () => {
  beforeEach(() => {
    sessionStorage.clear()
    clearAuthIntent()
    clearReturnTo()
  })

  it('sends patients who still need intake to /intake', () => {
    const user = { role: 'patient', email: 'brand.new@example.com' }
    expect(postAuthRedirect(user, { intent: 'book' })).toBe('/intake')
  })

  it('sends patients with a complete profile to the dashboard when booking', () => {
    const user = { role: 'patient', patientId: 'patient-1', email: 'patient@ayursutra.dev' }
    rememberAuthIntent('book')
    expect(postAuthRedirect(user, { intent: 'book' })).toBe('/dashboard')
  })

  it('sends staff demo logins to the dashboard', () => {
    const user = { role: 'therapist' }
    expect(postAuthRedirect(user, { demo: true })).toBe('/dashboard')
  })

  it('sends administrators to the dashboard', () => {
    const user = { role: 'admin' }
    expect(postAuthRedirect(user, { demo: true })).toBe('/dashboard')
  })

  it('returns patients to the booking link after sign-in', () => {
    const user = { role: 'patient', patientId: 'patient-1', email: 'patient@ayursutra.dev' }
    rememberReturnTo('/scheduling?therapyId=therapy-1&planId=plan-1')
    expect(postAuthRedirect(user)).toBe('/scheduling?therapyId=therapy-1&planId=plan-1')
  })
})
