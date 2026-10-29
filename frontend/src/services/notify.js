import { addItem, getAll, getById } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { formatDate, formatTime } from '../utils/date.js'

function therapistEmail(therapistId) {
  const therapist = getById('therapists', therapistId)
  if (therapist?.email) return therapist.email
  const user = getAll('users').find((row) => row.therapistId === therapistId)
  return user?.email || ''
}

export function notifySessionScheduled(appointment) {
  if (!appointment) return null
  const patient = getById('patients', appointment.patientId)
  const therapist = getById('therapists', appointment.therapistId)
  const therapy = getById('therapies', appointment.therapyId)
  const when = `${formatDate(appointment.date)} at ${formatTime(appointment.startTime)}–${formatTime(appointment.endTime)}`
  const procedure = therapy?.name || 'Panchakarma session'
  const recipients = [patient?.email, therapistEmail(appointment.therapistId)].filter(Boolean)
  const record = {
    id: generateId('notify'),
    type: 'session_scheduled',
    appointmentId: appointment.id,
    to: recipients,
    subject: `Session scheduled: ${procedure}`,
    body: `${patient?.fullName || 'Patient'} is scheduled for ${procedure} with ${therapist?.name || 'the assigned therapist'} on ${when}.`,
    createdAt: new Date().toISOString(),
  }
  addItem('notifications', record)
  return record
}
