import { describe, it, expect } from 'vitest'
import { createEmr, getEmrForPatient } from '../services/emr.js'

const VALID_EMR = {
  patientId: 'patient-1',
  symptoms: 'Lower back pain',
  diagnosis: 'Vata imbalance',
  treatmentPlan: 'Abhyanga for 14 days',
  therapyId: 'therapy-1',
  therapyDurationMins: 60,
  numberOfSessions: 14,
  doctorNotes: 'Avoid cold food',
  followUpDate: '2026-09-01',
}

describe('EMR Service', () => {
  it('creates an EMR record', async () => {
    const record = await createEmr(VALID_EMR, 'user-1')
    expect(record.id).toBeTruthy()
    expect(record.patientId).toBe('patient-1')
    expect(record.doctorId).toBe('user-1')
    expect(record.diagnosis).toBe('Vata imbalance')
  })

  it('timestamps the EMR record on creation', async () => {
    const record = await createEmr(VALID_EMR, 'user-1')
    expect(new Date(record.createdAt)).toBeInstanceOf(Date)
  })

  it('retrieves EMR records for a patient', async () => {
    await createEmr(VALID_EMR, 'user-1')
    const records = await getEmrForPatient('patient-1')
    expect(records.length).toBeGreaterThan(0)
    expect(records.every((r) => r.patientId === 'patient-1')).toBe(true)
  })

  it('returns empty array for patient with no EMR', async () => {
    const records = await getEmrForPatient('nonexistent-patient')
    expect(records).toHaveLength(0)
  })

  it('sorts records with most recent first', async () => {
    await createEmr(VALID_EMR, 'user-1')
    await createEmr({ ...VALID_EMR, diagnosis: 'Later diagnosis' }, 'user-1')
    const records = await getEmrForPatient('patient-1')
    const seeded = records.filter(r => r.patientId === 'patient-1')
    expect(new Date(seeded[0].createdAt) >= new Date(seeded[1].createdAt)).toBe(true)
  })
})
