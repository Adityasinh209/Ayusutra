import { patientNeedsIntake } from '../services/patients.js'

const INTENT_KEY = 'ayursutra:auth-intent'

export function rememberAuthIntent(intent) {
  if (intent) sessionStorage.setItem(INTENT_KEY, intent)
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
    return homePathForUser(user)
  }

  if (resolvedIntent === 'book') {
    clearAuthIntent()
  }

  return homePathForUser(user)
}
