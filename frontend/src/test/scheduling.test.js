import { describe, it, expect } from 'vitest'
import { recommendSlots } from '../services/scheduling.js'
import { confirmAppointment, cancelAppointment, getAppointmentsForPatient } from '../services/appointments.js'

describe('Scheduling Service', () => {
  it('returns candidate slots for a known patient-therapy pair', async () => {
    const slots = await recommendSlots({ patientId: 'patient-1', therapyId: 'therapy-1' })
    expect(slots.length).toBeGreaterThan(0)
  })

  it('marks exactly one slot as recommended', async () => {
    const slots = await recommendSlots({ patientId: 'patient-1', therapyId: 'therapy-1' })
    const recommended = slots.filter((s) => s.recommended)
    expect(recommended).toHaveLength(1)
  })

  it('enriches slots with therapist details', async () => {
    const slots = await recommendSlots({ patientId: 'patient-1', therapyId: 'therapy-1' })
    expect(slots[0].therapist).toBeTruthy()
    expect(slots[0].therapist.name).toBeTruthy()
  })

  it('enriches slots with room details', async () => {
    const slots = await recommendSlots({ patientId: 'patient-1', therapyId: 'therapy-1' })
    expect(slots[0].room).toBeTruthy()
    expect(slots[0].room.name).toBeTruthy()
  })

  it('enriches slots with therapy details', async () => {
    const slots = await recommendSlots({ patientId: 'patient-1', therapyId: 'therapy-1' })
    expect(slots[0].therapy).toBeTruthy()
    expect(slots[0].therapy.name).toBe('Abhyanga')
  })

  it('returns empty array for unknown patient-therapy combination', async () => {
    const slots = await recommendSlots({ patientId: 'patient-1', therapyId: 'therapy-99' })
    expect(slots).toHaveLength(0)
  })

  it('recommended slot has a reason string', async () => {
    const slots = await recommendSlots({ patientId: 'patient-2', therapyId: 'therapy-2' })
    const rec = slots.find((s) => s.recommended)
    expect(typeof rec.reason).toBe('string')
    expect(rec.reason.length).toBeGreaterThan(10)
  })
})

describe('Appointment Confirmation', () => {
  it('creates an appointment from a confirmed slot', async () => {
    const slots = await recommendSlots({ patientId: 'patient-1', therapyId: 'therapy-1' })
    const slot = slots[0]
    const appt = await confirmAppointment(slot, {
      patientId: 'patient-1',
      therapyId: 'therapy-1',
      createdBy: 'user-2',
    })
    expect(appt.id).toBeTruthy()
    expect(appt.status).toBe('Scheduled')
    expect(appt.patientId).toBe('patient-1')
    expect(appt.therapistId).toBe(slot.therapistId)
    expect(appt.roomId).toBe(slot.roomId)
  })

  it('new appointment appears in patient appointment list', async () => {
    const slots = await recommendSlots({ patientId: 'patient-3', therapyId: 'therapy-3' })
    const slot = slots[0]
    await confirmAppointment(slot, {
      patientId: 'patient-3',
      therapyId: 'therapy-3',
      createdBy: 'user-2',
    })
    const appts = await getAppointmentsForPatient('patient-3')
    expect(appts.some((a) => a.patientId === 'patient-3')).toBe(true)
  })

  it('cancels an appointment and updates status', async () => {
    const slots = await recommendSlots({ patientId: 'patient-1', therapyId: 'therapy-1' })
    const appt = await confirmAppointment(slots[0], {
      patientId: 'patient-1',
      therapyId: 'therapy-1',
      createdBy: 'user-2',
    })
    const cancelled = await cancelAppointment(appt.id)
    expect(cancelled.status).toBe('Cancelled')
  })

  it('throws when cancelling a non-existent appointment', async () => {
    await expect(cancelAppointment('nonexistent-id')).rejects.toThrow('Appointment not found.')
  })
})
