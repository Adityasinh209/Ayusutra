/**
 * EMR (Electronic Medical Record) service.
 * Phase 2 mapping:
 *   createEmr(data)            → POST /api/emr
 *   getEmrForPatient(patientId) → GET  /api/patients/:id/emr
 */

import { getAll, addItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getEmrForPatient(patientId) {
  await delay()
  return getAll('emr_records')
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function createEmr(data, doctorId) {
  await delay()
  const record = {
    id: generateId('emr'),
    ...data,
    doctorId,
    createdAt: new Date().toISOString(),
  }
  return addItem('emr_records', record)
}
