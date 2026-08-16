/**
 * Therapist service.
 * Phase 2 mapping: GET /api/therapists
 */

import { getAll, getById } from '../mocks/store.js'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listTherapists() {
  await delay()
  return getAll('therapists').filter((t) => t.active)
}

export async function getTherapist(id) {
  await delay()
  return getById('therapists', id)
}

export async function getAvailability(therapistId) {
  await delay()
  return getAll('therapist_availability').filter((a) => a.therapistId === therapistId)
}

export async function getLeaves(therapistId) {
  await delay()
  return getAll('therapist_leaves').filter((l) => l.therapistId === therapistId)
}
