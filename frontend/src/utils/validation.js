export function required(value, label = 'This field') {
  if (!value || !String(value).trim()) return `${label} is required.`
  return null
}

export function validPhone(value) {
  if (!/^\d{10}$/.test(value)) return 'Enter a valid 10-digit phone number.'
  return null
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
