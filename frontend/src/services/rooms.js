/**
 * Therapy room service.
 * Phase 2 mapping: GET /api/rooms
 */

import { getAll, getById } from '../mocks/store.js'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listRooms() {
  await delay()
  return getAll('therapy_rooms').filter((r) => r.active)
}

export async function getRoom(id) {
  await delay()
  return getById('therapy_rooms', id)
}
