/**
 * Therapy master service.
 * Phase 2 mapping: GET /api/therapies
 */

import { getAll, getById } from '../mocks/store.js'
import { api, remoteReady } from './http.js'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listTherapies() {
  if (remoteReady()) return api('/api/therapies')
  await delay()
  return getAll('therapies').filter((t) => t.active)
}

export async function getTherapy(id) {
  await delay()
  return getById('therapies', id)
}
