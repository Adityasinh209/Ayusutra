/**
 * Patient service.
 * Phase 2 mapping:
 *   listPatients()          → GET  /api/patients
 *   getPatient(id)          → GET  /api/patients/:id
 *   createPatient(data)     → POST /api/patients
 */

import { getAll, getById, addItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listPatients() {
  await delay()
  return getAll('patients').sort(
    (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt),
  )
}

export async function getPatient(id) {
  await delay()
  const patient = getById('patients', id)
  if (!patient) {
    const err = new Error('Patient not found.')
    err.status = 404
    throw err
  }
  return patient
}

export async function createPatient(data, createdByUserId) {
  await delay()
  const all = getAll('patients')
  const duplicate = all.find(
    (p) => p.phone === data.phone || (data.email && p.email === data.email),
  )
  if (duplicate) {
    const err = new Error('A patient with this phone number or email already exists.')
    err.status = 409
    throw err
  }
  const patient = {
    id: generateId('patient'),
    ...data,
    registeredAt: new Date().toISOString(),
    registeredBy: createdByUserId,
  }
  return addItem('patients', patient)
}
