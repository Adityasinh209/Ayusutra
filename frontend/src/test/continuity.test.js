import { describe, expect, it } from 'vitest'
import { addItem, getAll } from '../mocks/store.js'
import { confirmAppointment } from '../services/appointments.js'
import { createEmr } from '../services/emr.js'
import { pickOpenAppointment } from '../services/continuity.js'

describe('automatic bill, follow-up, and visit link', () => {
  it('opens a pending bill when a visit is booked', async () => {
    const visit = await confirmAppointment(
      { therapistId: 'therapist-1', roomId: 'room-1', date: '2026-12-09', startTime: '16:00', endTime: '17:00' },
      { patientId: 'patient-3', therapyId: 'therapy-1', createdBy: 'user-2', treatmentStage: 'Purva Karma', sessionNumber: 1 },
    )
    const bill = getAll('billing').find((item) => item.appointmentId === visit.id)
    expect(bill.paymentStatus).toBe('Pending')
    expect(bill.totalAmount).toBe(1000)
  })

  it('links the open visit and writes the package bill and follow-up from consultation', async () => {
    const visit = addItem('appointments', {
      id: 'appt-continuity',
      patientId: 'patient-4',
      therapyId: 'therapy-2',
      therapistId: 'therapist-2',
      roomId: 'room-3',
      date: '2026-12-10',
      startTime: '11:00',
      endTime: '11:45',
      status: 'Scheduled',
    })
    expect(pickOpenAppointment(getAll('appointments').filter((row) => row.patientId === 'patient-4')).id).toBe(visit.id)
    await createEmr({
      patientId: 'patient-4',
      symptoms: 'Insomnia',
      diagnosis: 'Pitta',
      treatmentPlan: 'Shirodhara',
      therapyId: 'therapy-2',
      numberOfSessions: 4,
      followUpDate: '2026-12-24',
      treatmentStage: 'Purva Karma',
    }, 'user-1')
    const linked = getAll('appointments').find((row) => row.id === visit.id)
    expect(linked.planId).toBeTruthy()
    const bill = getAll('billing').find((item) => item.planId === linked.planId)
    expect(bill.totalAmount).toBe(4000)
    expect(bill.paymentStatus).toBe('Pending')
    const followup = getAll('followups').find((item) => item.patientId === 'patient-4' && item.followupDate === '2026-12-24')
    expect(followup.status).toBe('Pending')
  })
})