import { describe, it, expect, beforeEach } from 'vitest'
import { postAuthRedirect, rememberAuthIntent, clearAuthIntent } from '../auth/postAuthRedirect.js'

describe('postAuthRedirect', () => {
  beforeEach(() => {
    sessionStorage.clear()
    clearAuthIntent()
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
})
