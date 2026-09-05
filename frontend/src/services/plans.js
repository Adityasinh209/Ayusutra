/**
 * Panchakarma Treatment Plans service.
 * Manages clinical progression through stages:
 * Consultation → Plan → Purva Karma → Pradhana Karma → Paschat Karma → Follow-up → Completed
 */

import { getAll, getById, addItem, updateItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listPlans() {
  await delay()
  return getAll('panchakarma_plans').sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
}

export async function getPlan(id) {
  await delay()
  const plan = getById('panchakarma_plans', id)
  if (!plan) {
    const err = new Error('Panchakarma Plan not found.')
    err.status = 404
    throw err
  }
  return plan
}

export async function getPlansForPatient(patientId) {
  await delay()
  return getAll('panchakarma_plans')
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function createPlan(data, doctorId) {
  await delay()
  const plan = {
    id: generateId('plan'),
    ...data,
    doctorId,
    treatmentStage: data.treatmentStage || 'Purva Karma',
    status: 'In Progress',
    completedSessions: data.completedSessions || 0,
    createdAt: new Date().toISOString(),
  }
  return addItem('panchakarma_plans', plan)
}

export async function updatePlanStage(id, nextStage) {
  await delay()
  const updated = updateItem('panchakarma_plans', id, {
    treatmentStage: nextStage,
    ...(nextStage === 'Completed' ? { status: 'Completed', completedAt: new Date().toISOString() } : {}),
  })
  if (!updated) {
    const err = new Error('Panchakarma Plan not found.')
    err.status = 404
    throw err
  }
  return updated
}

export async function incrementPlanSession(id) {
  await delay()
  const plan = getById('panchakarma_plans', id)
  if (!plan) return null
  const completed = (plan.completedSessions || 0) + 1
  return updateItem('panchakarma_plans', id, {
    completedSessions: completed,
    ...(completed >= plan.totalSessions ? { treatmentStage: 'Paschat Karma' } : {}),
  })
}
