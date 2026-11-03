import { getAll } from '../mocks/store.js'
import { api, remoteReady } from './http.js'

const KEY = 'ayursutra:otp'
const MAX_ATTEMPTS = 5
const HOURLY_LIMIT = 5

export function canonicalPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  const mobile = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  if (!/^\d{10}$/.test(mobile)) {
    const err = new Error('Mobile number must contain exactly 10 digits.')
    err.status = 422
    throw err
  }
  return mobile
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function writeStore(rows) {
  localStorage.setItem(KEY, JSON.stringify(rows))
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function phoneTaken(phone, { ignorePatientId } = {}) {
  const patients = getAll('patients')
  const users = getAll('users')
  const therapists = getAll('therapists')
  return patients.some((p) => p.phone === phone && p.id !== ignorePatientId)
    || users.some((u) => u.phone === phone && u.patientId !== ignorePatientId && u.id !== ignorePatientId)
    || therapists.some((t) => t.phone === phone)
}

export function peekLatestOtp(mobile, purpose) {
  const phone = canonicalPhone(mobile)
  const rows = readStore()
  const row = [...rows].reverse().find((item) => item.mobile === phone && item.purpose === purpose && !item.consumed && !item.verified)
  return row?.otp || ''
}

export async function sendOtp(mobile, purpose, options = {}) {
  const phone = canonicalPhone(mobile)
  if (remoteReady()) return api('/api/send-otp', { method: 'POST', body: { mobile: phone, purpose } })
  if (purpose !== 'emergency_contact' && phoneTaken(phone, options)) {
    const err = new Error('This mobile number is already registered.')
    err.status = 409
    throw err
  }
  const rows = readStore()
  const hourAgo = Date.now() - 60 * 60 * 1000
  const hourly = rows.filter((row) => row.mobile === phone && row.purpose === purpose && row.createdAt > hourAgo).length
  if (hourly >= HOURLY_LIMIT) {
    const err = new Error('Too many OTP requests. Try again later.')
    err.status = 429
    throw err
  }
  const latest = rows.filter((row) => row.mobile === phone && row.purpose === purpose && !row.consumed).at(-1)
  if (latest && !latest.verified && latest.resendAt > Date.now()) {
    const err = new Error('Wait 30 seconds before resending the OTP.')
    err.status = 429
    throw err
  }
  rows.forEach((row) => {
    if (row.mobile === phone && row.purpose === purpose && !row.consumed && !row.verified) {
      row.consumed = true
    }
  })
  const otp = generateOtp()
  rows.push({
    mobile: phone,
    purpose,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    resendAt: Date.now() + 30 * 1000,
    createdAt: Date.now(),
    attempts: 0,
    verified: false,
    consumed: false,
    token: '',
  })
  writeStore(rows)
  return { sent: true, mobile: phone, purpose, resendAfterSeconds: 30, expiresInSeconds: 300 }
}

export async function verifyOtp(mobile, purpose, otp) {
  const phone = canonicalPhone(mobile)
  if (remoteReady()) return api('/api/verify-otp', { method: 'POST', body: { mobile: phone, purpose, otp } })
  const rows = readStore()
  const row = [...rows].reverse().find((item) => item.mobile === phone && item.purpose === purpose && !item.consumed && !item.verified)
  if (!row || row.expiresAt < Date.now()) {
    const err = new Error('OTP expired or was not requested. Send a new code.')
    err.status = 400
    throw err
  }
  row.attempts = (row.attempts || 0) + 1
  if (String(otp) !== row.otp) {
    if (row.attempts >= MAX_ATTEMPTS) {
      row.consumed = true
      writeStore(rows)
      const locked = new Error('Too many incorrect attempts. Request a new OTP.')
      locked.status = 400
      throw locked
    }
    writeStore(rows)
    const err = new Error('Incorrect OTP.')
    err.status = 400
    throw err
  }
  row.verified = true
  row.token = `otp-${phone}-${purpose}-${Date.now()}`
  writeStore(rows)
  return { verified: true, mobile: phone, purpose, verificationToken: row.token }
}

export function consumeOtp(token, mobile, purpose) {
  const phone = canonicalPhone(mobile)
  const rows = readStore()
  const row = rows.find((item) => item.token === token && item.verified && !item.consumed)
  if (!row || row.mobile !== phone || row.purpose !== purpose) {
    const err = new Error('Verify the mobile number before completing registration.')
    err.status = 400
    throw err
  }
  row.consumed = true
  writeStore(rows)
}

export function resetOtpStore() {
  localStorage.removeItem(KEY)
}
