export function required(value, label = 'This field') {
  if (!value || !String(value).trim()) return `${label} is required.`
  return null
}

export function indianMobileDigits(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
}

export function validPhone(value) {
  if (!/^\d{10}$/.test(value)) return 'Enter a valid 10-digit phone number.'
  return null
}

export function validEmergencyName(value) {
  const name = String(value || '').trim()
  if (!name) return 'Emergency contact name is required.'
  if (name.length < 2 || name.length > 60) return 'Emergency contact name must be 2 to 60 characters.'
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) return 'Emergency contact name may contain letters and spaces only.'
  return null
}

export function validEmergencyPhone(value, patientPhone) {
  const mobile = indianMobileDigits(value)
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return 'Enter a valid 10-digit Indian mobile number starting with 6–9, with country code +91.'
  }
  const own = indianMobileDigits(patientPhone)
  if (own && mobile === own) {
    return 'Emergency contact number cannot be the same as the patient’s mobile number.'
  }
  return null
}

export function formatEmergencyContact(name, phone) {
  return `${String(name || '').trim()} - ${indianMobileDigits(phone)}`
}

export function parseEmergencyContact(raw) {
  const text = String(raw || '').trim()
  const match = text.match(/^(.*?)\s*[-–—]\s*(?:\+?91)?\s*(\d{10})$/)
  if (match) return { name: match[1].trim(), phone: match[2] }
  return { name: text, phone: '' }
}

export function validEmail(value) {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.'
  return null
}

export function validate(rules) {
  const errors = {}
  let hasError = false
  Object.entries(rules).forEach(([field, result]) => {
    if (result) {
      errors[field] = result
      hasError = true
    }
  })
  return { errors, hasError }
}
