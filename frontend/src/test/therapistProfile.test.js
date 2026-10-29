import { describe, expect, it } from 'vitest'
import { buildTherapistProfilePayload, createInitialTherapistProfile } from '../utils/therapistProfile.js'

describe('therapist profile payload', () => {
  it('builds FastAPI-ready JSON with selected therapies and working days', () => {
    const form = createInitialTherapistProfile({ name: 'Amit Joshi', email: 'amit@ayursutra.dev' })
    form.qualification = 'BAMS'
    form.yearsOfExperience = '8'
    form.specialization = 'Abhyanga'
    form.selectedTherapies = { abhyanga: { duration: '60' }, shirodhara: { duration: '45' } }

    const payload = buildTherapistProfilePayload(form)

    expect(payload.therapist.fullName).toBe('Amit Joshi')
    expect(payload.therapist.email).toBe('amit@ayursutra.dev')
    expect(payload.therapies).toEqual([
      { id: 'abhyanga', name: 'Abhyanga', durationMinutes: 60 },
      { id: 'shirodhara', name: 'Shirodhara', durationMinutes: 45 },
    ])
    expect(payload.availability).toHaveLength(7)
    expect(payload.availability.find((d) => d.day === 'sunday').working).toBe(false)
    expect(payload.availability.find((d) => d.day === 'monday').startTime).toBe('09:00')
  })
})
