/**
 * Panchakarma Treatment Plans service.
 * Manages clinical progression through stages:
 * Consultation → Plan → Purva Karma → Pradhana Karma → Paschat Karma → Follow-up → Completed
 */

import { getAll, getById, addItem, updateItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { api, remoteReady } from './http.js'

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function pickActivePlan(plans = []) {
  const ranked = [...plans].sort((a, b) => {
    const byDate = new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    if (Number.isNaN(byDate) || byDate === 0) return String(b.id || '').localeCompare(String(a.id || ''))
    return byDate
  })
  return (
    ranked.find((p) => p.status === 'In Progress' || p.status === 'Active')
    || ranked.find((p) => p.status !== 'Completed')
    || ranked[0]
    || null
  )
}

function planPayload(data, doctorId) {
  return {
    ...data,
    doctorId,
    treatmentStage: data.treatmentStage || 'Purva Karma',
    status: 'In Progress',
    completedSessions: data.completedSessions || 0,
    procedureName: data.procedureName || data.primaryPanchakarma || 'Panchakarma Protocol',
    assignedTherapistId: data.assignedTherapistId || null,
    assignedRoomId: data.assignedRoomId || null,
  }
}

export async function listPlans() {
  if (remoteReady()) return api('/api/plans')
  await delay()
  return getAll('panchakarma_plans').sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
}

export async function getPlan(id) {
  if (remoteReady()) {
    const rows = await api('/api/plans')
    const plan = rows.find((p) => p.id === id)
    if (!plan) {
      const err = new Error('Panchakarma Plan not found.')
      err.status = 404
      throw err
    }
    return plan
  }
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
  if (remoteReady()) {
    const rows = await api('/api/plans')
    return rows.filter((p) => p.patientId === patientId)
  }
  await delay()
  return getAll('panchakarma_plans')
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function createPlan(data, doctorId) {
  if (remoteReady()) return api('/api/plans', { method: 'POST', body: data })
  await delay()
  const payload = planPayload(data, doctorId)
  const current = pickActivePlan(
    getAll('panchakarma_plans').filter((p) => p.patientId === data.patientId),
  )
  if (current && current.status !== 'Completed') {
    return updateItem('panchakarma_plans', current.id, {
      ...payload,
      updatedAt: new Date().toISOString(),
    })
  }
  return addItem('panchakarma_plans', {
    id: generateId('plan'),
    ...payload,
    createdAt: new Date().toISOString(),
  })
}

export async function updatePlanStage(id, nextStage) {
  if (remoteReady()) return api(`/api/plans/${id}/stage`, { method: 'PATCH', body: { treatmentStage: nextStage } })
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
