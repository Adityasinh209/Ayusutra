/**
 * Appointment / Therapy Session Service.
 *
 * Tracks Panchakarma therapy sessions:
 * Patient, Therapy, Stage (Purva/Pradhana/Paschat Karma), Session Number,
 * Date/Time, Therapist, Room, Status, Therapist Observations, Doctor Remarks.
 */

import { getAll, addItem, updateItem, getById } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { incrementPlanSession } from './plans.js'

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listAppointments() {
  await delay()
  return getAll('appointments').sort(
    (a, b) => new Date(b.date) - new Date(a.date) || b.startTime.localeCompare(a.startTime),
  )
}

export async function getAppointmentsForPatient(patientId) {
  await delay()
  return getAll('appointments')
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function getAppointmentsForTherapist(therapistId) {
  await delay()
  return getAll('appointments')
    .filter((a) => a.therapistId === therapistId)
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.startTime.localeCompare(b.startTime))
}

export async function confirmAppointment(slot, { patientId, therapyId, createdBy, treatmentStage, sessionNumber, planId }) {
  await delay()

  // Determine existing session count for sequencing if not provided
  const patientAppts = getAll('appointments').filter((a) => a.patientId === patientId)
  const computedSessionNumber = sessionNumber || (patientAppts.length + 1)

  const appointment = {
    id: generateId('appt'),
    patientId,
    therapyId,
    therapistId: slot.therapistId,
    roomId: slot.roomId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    treatmentStage: treatmentStage || slot.treatmentStage || 'Purva Karma',
    sessionNumber: computedSessionNumber,
    planId: planId || slot.planId || null,
    status: 'Scheduled',
    sessionNotes: '',
    therapistObservations: '',
    doctorRemarks: '',
    createdBy,
    createdAt: new Date().toISOString(),
  }
  return addItem('appointments', appointment)
}

export async function completeAppointment(id, { sessionNotes = '', therapistObservations = '', doctorRemarks = '' } = {}) {
  await delay()
  const existing = getById('appointments', id)
  const updated = updateItem('appointments', id, {
    status: 'Completed',
    sessionNotes: sessionNotes.trim() || existing?.sessionNotes || '',
    therapistObservations: therapistObservations.trim() || existing?.therapistObservations || sessionNotes.trim(),
    doctorRemarks: doctorRemarks.trim() || existing?.doctorRemarks || '',
    completedAt: new Date().toISOString(),
  })
  if (!updated) {
    const err = new Error('Session appointment not found.')
    err.status = 404
    throw err
  }

  // If tied to a Panchakarma plan, increment the completed session count
  if (updated.planId) {
    try {
      await incrementPlanSession(updated.planId)
    } catch {
      // Ignore if plan not found
    }
  }

  return updated
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
