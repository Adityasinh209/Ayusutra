import { getAll } from '../mocks/store.js'
import { findPatientForUser } from '../services/patients.js'

const ALLOWED_ROLES = ['therapist', 'receptionist', 'patient', 'doctor', 'admin']

export function seedUserForRole(role) {
  return getAll('users').find((u) => u.role === role) ?? null
}

export function mapClerkUserToClinicUser(clerkUser) {
  if (!clerkUser) return null

  const email = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase() ?? ''
  const emailMatch = getAll('users').find((u) => u.email?.toLowerCase() === email)
  const metadataRole = clerkUser.publicMetadata?.role
  const role = emailMatch?.role || (ALLOWED_ROLES.includes(metadataRole) ? metadataRole : 'patient')

  const mapped = emailMatch
    ? {
        id: emailMatch.id,
        name: clerkUser.fullName || clerkUser.firstName || emailMatch.name,
        email: email || emailMatch.email,
        role: emailMatch.role,
        roleLabel: emailMatch.roleLabel,
        ...(emailMatch.patientId ? { patientId: emailMatch.patientId } : {}),
        ...(emailMatch.therapistId ? { therapistId: emailMatch.therapistId } : {}),
        clerkId: clerkUser.id,
      }
    : {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || 'Guest',
        email,
        role,
        roleLabel: role === 'patient' ? 'Patient' : role.charAt(0).toUpperCase() + role.slice(1),
        clerkId: clerkUser.id,
      }
  const linked = findPatientForUser(mapped)
  if (linked?.id) mapped.patientId = linked.id
  return mapped
}
