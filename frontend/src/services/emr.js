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

import { getAll, addItem, getById } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { createPlan } from './plans.js'

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getEmrForPatient(patientId) {
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
  await delay()
  const emrId = generateId('emr')
  const record = {
    id: emrId,
    ...data,
    doctorId,
    createdAt: new Date().toISOString(),
  }
  addItem('emr_records', record)

  // Auto-generate or link a Panchakarma Treatment Plan if therapy & sessions specified
  if (data.therapyId && data.numberOfSessions) {
    try {
      const therapies = getAll('therapies')
      const prescribedTherapy = therapies.find((t) => t.id === data.therapyId)
      await createPlan(
        {
          patientId: data.patientId,
          emrId,
          procedureName: prescribedTherapy ? prescribedTherapy.name : 'Panchakarma Protocol',
          primaryPanchakarma: prescribedTherapy?.category === 'Panchakarma Procedure' ? prescribedTherapy.name : 'Purva Karma',
          treatmentStage: data.treatmentStage || 'Purva Karma',
          totalSessions: Number(data.numberOfSessions) || 7,
          completedSessions: 0,
          startDate: new Date().toISOString().slice(0, 10),
          endDate: data.followUpDate || '',
          doctorInstructions: data.doctorNotes || data.treatmentPlan || '',
          dietPlan: data.dietaryInstructions || 'Follow Pathya-Apathya as prescribed.',
          followUpDate: data.followUpDate || '',
        },
        doctorId,
      )
    } catch {
      // Continue even if plan creation encountered non-fatal issues
    }
  }

  return record
}
