import { describe, it, expect, beforeEach } from 'vitest'
import { createPatient, listPatients, getPatient } from '../services/patients.js'

const VALID_PATIENT = {
  fullName: 'Test Patient',
  dateOfBirth: '1990-06-15',
  gender: 'Female',
  phone: '9001234567',
  email: 'test@example.com',
  address: '1 Test Street, Mumbai',
  medicalHistory: '',
  emergencyContact: 'Test Contact - 9001234568',
}

describe('Patient Service', () => {
  it('creates a patient with valid data', async () => {
    const patient = await createPatient(VALID_PATIENT, 'user-2')
    expect(patient.id).toBeTruthy()
    expect(patient.fullName).toBe('Test Patient')
    expect(patient.registeredBy).toBe('user-2')
  })

  it('lists patients including newly created ones', async () => {
    await createPatient(VALID_PATIENT, 'user-2')
    const patients = await listPatients()
    expect(patients.some((p) => p.phone === '9001234567')).toBe(true)
  })

  it('retrieves a patient by ID', async () => {
    const created = await createPatient(VALID_PATIENT, 'user-2')
    const fetched = await getPatient(created.id)
    expect(fetched.fullName).toBe('Test Patient')
  })

  it('throws 404 for an unknown patient ID', async () => {
    await expect(getPatient('nonexistent-id')).rejects.toThrow('Patient not found.')
  })

  it('rejects duplicate phone number', async () => {
    await createPatient(VALID_PATIENT, 'user-2')
    await expect(createPatient(VALID_PATIENT, 'user-2')).rejects.toThrow(
      'A patient with this phone number or email already exists.',
    )
  })

  it('rejects duplicate email', async () => {
    await createPatient(VALID_PATIENT, 'user-2')
    const different = { ...VALID_PATIENT, phone: '9999888777' }
    await expect(createPatient(different, 'user-2')).rejects.toThrow(
      'A patient with this phone number or email already exists.',
    )
  })

  it('allows empty email (field is optional)', async () => {
    const noEmail = { ...VALID_PATIENT, phone: '9111222333', email: '' }
    const patient = await createPatient(noEmail, 'user-2')
    expect(patient.email).toBe('')
  })
})
