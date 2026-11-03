import { patientNeedsIntake } from '../services/patients.js'

const INTENT_KEY = 'ayursutra:auth-intent'
const RETURN_KEY = 'ayursutra:return-to'

export function rememberAuthIntent(intent) {
  if (intent) sessionStorage.setItem(INTENT_KEY, intent)
}

export function rememberReturnTo(path) {
  if (path) sessionStorage.setItem(RETURN_KEY, path)
}

export function readReturnTo() {
  try {
    return sessionStorage.getItem(RETURN_KEY)
  } catch {
    return null
  }
}

export function clearReturnTo() {
  try {
    sessionStorage.removeItem(RETURN_KEY)
  } catch {
    /* ignore */
  }
}

export function readAuthIntent() {
  try {
    return sessionStorage.getItem(INTENT_KEY)
  } catch {
    return null
  }
}

export function clearAuthIntent() {
  try {
    sessionStorage.removeItem(INTENT_KEY)
  } catch {
    /* ignore */
  }
}

export function homePathForUser(_user) {
  return '/dashboard'
}

export function postAuthRedirect(user, { intent, demo } = {}) {
  const resolvedIntent = intent || readAuthIntent()

  if (user?.role === 'patient' && patientNeedsIntake(user)) {
    return '/intake'
  }

  if (demo) {
    clearAuthIntent()
    clearReturnTo()
    return homePathForUser(user)
  }

  const returnTo = readReturnTo()
  if (returnTo) {
    clearReturnTo()
    if (resolvedIntent === 'book') clearAuthIntent()
    return returnTo
  }

  if (resolvedIntent === 'book') {
    clearAuthIntent()
  }

  return homePathForUser(user)
}
