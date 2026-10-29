import { useState } from 'react'
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OtpVerification from '../components/otp/OtpVerification.jsx'
import { resetOtpStore, sendOtp, verifyOtp } from '../services/otp.js'
import { createPatient } from '../services/patients.js'
import { acceptAppointment } from '../services/appointments.js'
import { addItem } from '../mocks/store.js'
import { createPreviousTreatment, listPreviousTreatments } from '../services/previousTreatments.js'

function Harness() {
  const [token, setToken] = useState('')
  return (
    <>
      <OtpVerification
        mobile="9001234501"
        purpose="patient_register"
        verifiedToken={token}
        onVerified={setToken}
        onChangeNumber={() => setToken('')}
      />
      <p>{token ? 'verified' : 'unverified'}</p>
    </>
  )
}

describe('OTP registration and shared records', () => {
  beforeEach(() => {
    resetOtpStore()
  })

  it('verifies six digits, blocks an early resend, and allows a number change', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Send OTP' }))
    expect(screen.getByText(/Demo OTP: 123456/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Resend OTP/ }).disabled).toBe(true)
    const boxes = screen.getAllByLabelText(/OTP digit/)
    for (const [index, digit] of '123456'.split('').entries()) {
      await user.type(boxes[index], digit)
    }
    await user.click(screen.getByRole('button', { name: 'Verify OTP' }))
    expect(screen.getByText('verified')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Change Mobile Number' }))
    expect(screen.getByText('unverified')).toBeTruthy()
  })

  it('rejects a wrong code and blocks registration until a token is consumed', async () => {
    const sent = await sendOtp('9001234502', 'patient_register')
    await expect(verifyOtp('9001234502', 'patient_register', '000000')).rejects.toThrow('Incorrect OTP.')
    await expect(createPatient({
      fullName: 'OTP Patient',
      dateOfBirth: '1990-01-01',
      gender: 'Female',
      phone: '9001234502',
      email: 'otp-patient@example.com',
      address: '1 Lane',
      emergencyContact: 'Kin - 9001234503',
    }, 'user-2')).rejects.toThrow('Verify the mobile number')
    const verified = await verifyOtp('9001234502', 'patient_register', sent.debugOtp)
    const patient = await createPatient({
      fullName: 'OTP Patient',
      dateOfBirth: '1990-01-01',
      gender: 'Female',
      phone: '9001234502',
      email: 'otp-patient@example.com',
      address: '1 Lane',
      emergencyContact: 'Kin - 9001234503',
      otpVerificationToken: verified.verificationToken,
    }, 'user-2')
    expect(patient.phoneVerified).toBe(true)
  })

  it('confirms a scheduled appointment and stores previous treatment history', async () => {
    const appointment = addItem('appointments', {
      id: 'appt-otp-test',
      patientId: 'patient-1',
      therapyId: 'therapy-1',
      therapistId: 'therapist-1',
      roomId: 'room-1',
      date: '2026-12-04',
      startTime: '15:00',
      endTime: '16:00',
      status: 'Scheduled',
    })
    const accepted = await acceptAppointment(appointment.id)
    expect(accepted.status).toBe('Confirmed')
    await createPreviousTreatment('patient-1', {
      hospitalName: 'Local Clinic',
      treatmentName: 'Abhyanga',
      therapistName: 'Dr. Rao',
      diagnosis: 'Vata',
      startDate: '2025-01-01',
      endDate: '2025-01-07',
      medicines: '',
      notes: '',
    })
    const rows = await listPreviousTreatments('patient-1')
    expect(rows.some((row) => row.treatmentName === 'Abhyanga')).toBe(true)
  })
})
