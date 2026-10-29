/**
 * Ayurvedic EMR (Electronic Medical Record) service.
 *
 * Captures comprehensive Panchakarma Clinical Consultations:
 * - Ayurvedic Diagnostic Assessment (Prakriti, Vikriti, Ashtavidha Pariksha)
 * - Symptoms / Chief Complaints
 * - Panchakarma Indication & Procedure Selection
 * - Stage Protocol (Purva, Pradhana, Paschat Karma)
 * - Vaidya Instructions & Dietary Pathya-Apathya
 * - Follow-up Schedule
 */

import { getAll, addItem, getById, updateItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { createPlan } from './plans.js'
import { api, remoteReady } from './http.js'
import { ensureClinicalBill, ensureClinicalFollowup, pickOpenAppointment } from './continuity.js'

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getEmrForPatient(patientId) {
  if (remoteReady()) return api(`/api/patients/${patientId}/emr`)
  await delay()
  return getAll('emr_records')
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getEmrRecord(id) {
  await delay()
  return getById('emr_records', id)
}

export async function createEmr(data, doctorId) {
  if (remoteReady()) return api('/api/emr', { method: 'POST', body: data })
  await delay()
  const emrId = generateId('emr')
  const openVisit = data.appointmentId
    ? getById('appointments', data.appointmentId)
    : pickOpenAppointment(getAll('appointments').filter((row) => row.patientId === data.patientId))
  const record = {
    id: emrId,
    ...data,
    appointmentId: openVisit?.id || data.appointmentId || null,
    doctorId,
    createdAt: new Date().toISOString(),
  }
  addItem('emr_records', record)

  let plan = null
  if (data.therapyId || data.treatmentPlan || data.numberOfSessions) {
    const therapies = getAll('therapies')
    const prescribedTherapy = therapies.find((t) => t.id === data.therapyId)
    plan = await createPlan(
      {
        patientId: data.patientId,
        emrId,
        procedureName: prescribedTherapy?.name || data.treatmentPlan || 'Panchakarma Protocol',
        primaryPanchakarma: prescribedTherapy?.category === 'Panchakarma Procedure' ? prescribedTherapy.name : (data.primaryPanchakarma || 'Purva Karma'),
        treatmentStage: data.treatmentStage || 'Purva Karma',
        totalSessions: Number(data.numberOfSessions) || 7,
        completedSessions: 0,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: data.followUpDate || '',
        assignedTherapistId: openVisit?.therapistId || null,
        assignedRoomId: openVisit?.roomId || null,
        doctorInstructions: data.doctorNotes || data.treatmentPlan || '',
        dietPlan: data.dietaryInstructions || 'Follow Pathya-Apathya as prescribed.',
        followUpDate: data.followUpDate || '',
      },
      doctorId,
    )
    record.planId = plan?.id || null
    updateItem('emr_records', emrId, { planId: plan?.id || null })
    if (openVisit && plan) updateItem('appointments', openVisit.id, { planId: plan.id })
    ensureClinicalBill({
      patientId: data.patientId,
      appointmentId: openVisit?.id,
      planId: plan?.id,
      packageType: plan?.procedureName || 'Panchakarma Protocol',
      sessions: plan?.totalSessions || data.numberOfSessions,
    })
  }
  if (data.followUpDate) {
    ensureClinicalFollowup({
      patientId: data.patientId,
      followupDate: data.followUpDate,
      planId: plan?.id,
      therapistId: openVisit?.therapistId,
    })
  }

  return record
}
