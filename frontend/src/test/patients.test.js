import { describe, it, expect } from 'vitest'
import { createPatient, listPatients, getPatient, submitPatientIntake, patientNeedsIntake, findPatientForUser } from '../services/patients.js'
import { getAll } from '../mocks/store.js'
import { resetOtpStore, sendOtp, verifyOtp } from '../services/otp.js'

async function withOtp(data, purpose) {
  resetOtpStore()
  const sent = await sendOtp(data.phone, purpose)
  const verified = await verifyOtp(data.phone, purpose, sent.debugOtp)
  return { ...data, otpVerificationToken: verified.verificationToken }
}

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
    const patient = await createPatient(await withOtp(VALID_PATIENT, 'patient_register'), 'user-2')
    expect(patient.id).toBeTruthy()
    expect(patient.fullName).toBe('Test Patient')
    expect(patient.registeredBy).toBe('user-2')
  })

  it('lists patients including newly created ones', async () => {
    await createPatient(await withOtp(VALID_PATIENT, 'patient_register'), 'user-2')
    const patients = await listPatients()
    expect(patients.some((p) => p.phone === '9001234567')).toBe(true)
  })

  it('retrieves a patient by ID', async () => {
    const created = await createPatient(await withOtp(VALID_PATIENT, 'patient_register'), 'user-2')
    const fetched = await getPatient(created.id)
    expect(fetched.fullName).toBe('Test Patient')
  })

  it('throws 404 for an unknown patient ID', async () => {
    await expect(getPatient('nonexistent-id')).rejects.toThrow('Patient not found.')
  })

  it('rejects duplicate phone number', async () => {
    await createPatient(await withOtp(VALID_PATIENT, 'patient_register'), 'user-2')
    await expect(createPatient(VALID_PATIENT, 'user-2')).rejects.toThrow(
      'A patient with this phone number or email already exists.',
    )
  })

  it('rejects duplicate email', async () => {
    await createPatient(await withOtp(VALID_PATIENT, 'patient_register'), 'user-2')
    const different = await withOtp({ ...VALID_PATIENT, phone: '9999888777' }, 'patient_register')
    await expect(createPatient(different, 'user-2')).rejects.toThrow(
      'A patient with this phone number or email already exists.',
    )
  })

  it('allows empty email (field is optional)', async () => {
    const noEmail = await withOtp({ ...VALID_PATIENT, phone: '9111222333', email: '' }, 'patient_register')
    const patient = await createPatient(noEmail, 'user-2')
    expect(patient.email).toBe('')
  })

  it('requires intake for a patient without a linked record', () => {
    const user = { id: 'user-new', email: 'new.patient@ayursutra.dev', role: 'patient' }
    expect(patientNeedsIntake(user)).toBe(true)
    expect(findPatientForUser(user)).toBeNull()
  })

  it('saves intake data linked to the signed-in user', async () => {
    const user = { id: 'user-new', email: 'intake@ayursutra.dev', role: 'patient', clerkId: 'clerk_123' }
    const patient = await submitPatientIntake(await withOtp({
      fullName: 'Neha Iyer',
      phone: '9123456780',
      address: '88, MG Road, Pune',
      dateOfBirth: '1991-03-08',
      gender: 'Female',
      email: 'intake@ayursutra.dev',
      emergencyContact: 'Arun Iyer - 9123456781',
      chiefComplaint: 'Chronic lower back stiffness for 8 months',
      medicalHistory: '',
      allergies: '',
    }, 'patient_intake'), user)

    expect(patient.userId).toBe('user-new')
    expect(patient.clerkId).toBe('clerk_123')
    expect(patient.fullName).toBe('Neha Iyer')
    expect(findPatientForUser(user)?.id).toBe(patient.id)
    expect(patientNeedsIntake({ ...user, patientId: patient.id })).toBe(false)
  })

  it('upserts a clinic user profile when intake is submitted', async () => {
    const user = { id: 'clerk_user_xyz', email: 'profile.link@example.com', role: 'patient', clerkId: 'clerk_user_xyz' }
    const patient = await submitPatientIntake(await withOtp({
      fullName: 'Profile Link Test',
      phone: '9123456799',
      address: '22 Test Lane, Bengaluru',
      dateOfBirth: '1993-11-02',
      gender: 'Female',
      email: 'profile.link@example.com',
      emergencyContact: 'Contact - 9123456700',
      chiefComplaint: 'Stress-related insomnia',
      medicalHistory: '',
      allergies: '',
    }, 'patient_intake'), user)

    const profile = getAll('users').find((u) => u.id === 'clerk_user_xyz')
    expect(profile).toBeTruthy()
    expect(profile.patientId).toBe(patient.id)
    expect(profile.name).toBe('Profile Link Test')
  })
})
