/**
 * Therapy room service.
 * Phase 2 mapping: GET /api/rooms
 */

import { getAll, getById } from '../mocks/store.js'
import { api, remoteReady } from './http.js'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listRooms() {
  if (remoteReady()) return api('/api/rooms')
  await delay()
  return getAll('therapy_rooms').filter((r) => r.active)
}

export async function getRoom(id) {
  await delay()
  return getById('therapy_rooms', id)
}
