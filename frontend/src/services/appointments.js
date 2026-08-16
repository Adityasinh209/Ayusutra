/**
 * Appointment service.
 * Phase 2 mapping:
 *   listAppointments()                → GET  /api/appointments
 *   getAppointmentsForPatient(id)     → GET  /api/patients/:id/appointments
 *   confirmAppointment(slot, meta)    → POST /api/appointments
 *   cancelAppointment(id)             → PATCH /api/appointments/:id/cancel
 */

import { getAll, addItem, updateItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listAppointments() {
  await delay()
  return getAll('appointments').sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
}

export async function getAppointmentsForPatient(patientId) {
  await delay()
  return getAll('appointments')
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function confirmAppointment(slot, { patientId, therapyId, createdBy }) {
  await delay()
  const appointment = {
    id: generateId('appt'),
    patientId,
    therapyId,
    therapistId: slot.therapistId,
    roomId: slot.roomId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: 'Scheduled',
    createdBy,
    createdAt: new Date().toISOString(),
  }
  return addItem('appointments', appointment)
}

export async function cancelAppointment(id) {
  await delay()
  const updated = updateItem('appointments', id, { status: 'Cancelled' })
  if (!updated) {
    const err = new Error('Appointment not found.')
    err.status = 404
    throw err
  }
  return updated
}
