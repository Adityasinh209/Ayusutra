import { describe, it, expect } from 'vitest'
import { mapClerkUserToClinicUser } from '../auth/mapClerkUser.js'

describe('mapClerkUserToClinicUser', () => {
  it('maps a known clinic email to the seeded user and role', () => {
    const mapped = mapClerkUserToClinicUser({
      id: 'clerk_known',
      fullName: 'Rahul Sharma',
      primaryEmailAddress: { emailAddress: 'patient@ayursutra.dev' },
    })
    expect(mapped.role).toBe('patient')
    expect(mapped.id).toBe('user-3')
    expect(mapped.patientId).toBe('patient-1')
    expect(mapped.clerkId).toBe('clerk_known')
  })

  it('does not attach another patient record for brand-new Clerk sign-ups', () => {
    const mapped = mapClerkUserToClinicUser({
      id: 'clerk_new_patient',
      fullName: 'Priya Nair',
      primaryEmailAddress: { emailAddress: 'priya.nair@example.com' },
    })
    expect(mapped.role).toBe('patient')
    expect(mapped.id).toBe('clerk_new_patient')
    expect(mapped.patientId).toBeUndefined()
    expect(mapped.email).toBe('priya.nair@example.com')
  })
})
