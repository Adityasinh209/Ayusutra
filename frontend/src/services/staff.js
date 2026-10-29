import { addItem, getAll } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { api, remoteReady } from './http.js'
import { canonicalPhone, consumeOtp } from './otp.js'

export async function registerStaff(role, data) {
  if (remoteReady()) return api(`/api/staff?role=${role}`, { method: 'POST', body: data })
  const phone = canonicalPhone(data.mobile)
  const email = data.email.trim().toLowerCase()
  if (getAll('users').some((user) => user.email?.toLowerCase() === email)) {
    const err = new Error('A user with this email already exists.')
    err.status = 409
    throw err
  }
  consumeOtp(data.otpVerificationToken, phone, `${role}_register`)
  const user = addItem('users', {
    id: generateId('user'),
    name: data.fullName.trim(),
    email,
    phone,
    password: 'Welcome@123',
    role,
    roleLabel: role === 'therapist' ? 'Panchakarma Therapist' : 'Front Desk Coordinator',
    active: true,
  })
  if (role === 'therapist') {
    const therapist = addItem('therapists', {
      id: generateId('therapist'),
      name: data.fullName.trim(),
      gender: data.gender,
      phone,
      email,
      experienceYears: Number(data.yearsOfExperience) || 0,
      specializations: data.qualification ? [data.qualification] : [],
      therapyIds: [],
      status: 'Available',
      active: true,
    })
    user.therapistId = therapist.id
  }
  return user
}
