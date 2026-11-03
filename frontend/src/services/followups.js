import { getAll, addItem, updateItem, removeItem, getById } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { api, remoteReady } from './http.js'
import { pickActivePlan } from './plans.js'

export function pickCurrentFollowup(rows = [], plan = null) {
  const pending = rows.filter((row) => row.status && row.status !== 'Completed')
  const pool = pending.length ? pending : rows
  const latest = pool.length ? pool[pool.length - 1] : null
  return { followup: latest, followupDate: plan?.followUpDate || latest?.followupDate || null }
}

function ensure() {
  if (localStorage.getItem('ayursutra:followups') === null) {
    localStorage.setItem('ayursutra:followups', '[]')
  }
}

export async function listFollowups() {
  if (remoteReady()) return api('/api/followups')
  ensure()
  return getAll('followups')
}

export async function createFollowup(data) {
  if (remoteReady()) return api('/api/followups', { method: 'POST', body: data })
  ensure()
  const current = data.planId
    ? getAll('panchakarma_plans').find((plan) => plan.id === data.planId)
    : pickActivePlan(getAll('panchakarma_plans').filter((plan) => plan.patientId === data.patientId))
  const rec = addItem('followups', {
    id: generateId('followup'),
    patientId: data.patientId,
    therapistId: data.therapistId || null,
    planId: data.planId || current?.id || null,
    followupDate: data.followupDate,
    reminderSent: Boolean(data.reminderSent),
    status: data.status || 'Pending',
  })
  if (current) {
    updateItem('panchakarma_plans', current.id, {
      followUpDate: data.followupDate,
      ...(current.endDate ? {} : { endDate: data.followupDate }),
    })
  }
  return rec
}

export async function updateFollowup(id, data) {
  if (remoteReady()) return api(`/api/followups/${id}`, { method: 'PATCH', body: data })
  ensure()
  return updateItem('followups', id, data)
}

export async function deleteFollowup(id) {
  if (remoteReady()) return api(`/api/followups/${id}`, { method: 'DELETE' })
  ensure()
  const rec = getById('followups', id)
  if (!rec) {
    const err = new Error('Follow-up not found.')
    err.status = 404
    throw err
  }
  removeItem('followups', id)
  if (rec.planId) {
    const plan = getAll('panchakarma_plans').find((row) => row.id === rec.planId)
    if (plan && plan.followUpDate === rec.followupDate) {
      const remaining = getAll('followups').filter(
        (row) => row.planId === plan.id && row.status !== 'Completed',
      )
      const next = remaining[remaining.length - 1]
      updateItem('panchakarma_plans', plan.id, { followUpDate: next?.followupDate || '' })
    }
  }
  return { ok: true }
}

export async function sendFollowupReminder(id) {
  if (remoteReady()) return api(`/api/followups/${id}/remind`, { method: 'POST' })
  const err = new Error('Email service is not configured.')
  err.status = 503
  throw err
}
