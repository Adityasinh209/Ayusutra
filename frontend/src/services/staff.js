import { addItem, getAll, updateItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { api, remoteReady } from './http.js'
import { canonicalPhone, consumeOtp } from './otp.js'

export async function listReceptionists() {
  if (remoteReady()) return api('/api/receptionists')
  return getAll('users')
    .filter((user) => user.role === 'receptionist' && user.active !== false)
    .map((user) => ({
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      gender: user.gender || '',
      qualification: user.qualification || '',
      yearsOfExperience: user.yearsOfExperience || 0,
      shift: user.shift || 'Morning',
      address: user.address || '',
      active: user.active !== false,
      role: 'receptionist',
      roleLabel: user.roleLabel || 'Receptionist',
    }))
}

export async function deleteTherapist(id) {
  if (remoteReady()) return api(`/api/therapists/${id}`, { method: 'DELETE' })
  updateItem('therapists', id, { active: false })
  const linked = getAll('users').find((user) => user.therapistId === id)
  if (linked) updateItem('users', linked.id, { active: false })
  return { ok: true, id }
}

export async function deleteReceptionist(id) {
  if (remoteReady()) return api(`/api/receptionists/${id}`, { method: 'DELETE' })
  const user = getAll('users').find((item) => item.id === id)
  if (!user || user.role !== 'receptionist') {
    const err = new Error('Receptionist not found.')
    err.status = 404
    throw err
  }
  updateItem('users', id, { active: false })
  return { ok: true, id }
}

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
