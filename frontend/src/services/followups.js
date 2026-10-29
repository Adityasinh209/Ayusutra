import { getAll, addItem, updateItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { api, remoteReady } from './http.js'

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
  return addItem('followups', {
    id: generateId('followup'),
    patientId: data.patientId,
    therapistId: data.therapistId || null,
    planId: data.planId || null,
    followupDate: data.followupDate,
    reminderSent: Boolean(data.reminderSent),
    status: data.status || 'Pending',
  })
}

export async function updateFollowup(id, data) {
  if (remoteReady()) return api(`/api/followups/${id}`, { method: 'PATCH', body: data })
  ensure()
  return updateItem('followups', id, data)
}
