/**
 * localStorage-backed store adapter for the AyurSutra prototype.
 *
 * Each entity is stored as a JSON array under a namespaced key.
 * On first load the store is seeded from seed.js if it is empty.
 *
 * In Phase 2 this module is replaced by Axios calls to the FastAPI backend.
 * The public API (get / set / add / update / remove) intentionally mirrors
 * the shape that the real service layer will use.
 */

import {
  USERS,
  PATIENTS,
  THERAPIES,
  THERAPISTS,
  THERAPIST_AVAILABILITY,
  THERAPIST_LEAVES,
  THERAPY_ROOMS,
  EMR_RECORDS,
  APPOINTMENTS,
  PANCHAKARMA_PLANS,
  INVENTORY,
  BILLING_ITEMS,
  CANDIDATE_SLOTS,
} from './seed.js'

const NS = 'ayursutra'
const key = (entity) => `${NS}:${entity}`

function load(entity) {
  try {
    const raw = localStorage.getItem(key(entity))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function save(entity, data) {
  localStorage.setItem(key(entity), JSON.stringify(data))
}

const SEEDS = {
  users: USERS,
  patients: PATIENTS,
  therapies: THERAPIES,
  therapists: THERAPISTS,
  therapist_availability: THERAPIST_AVAILABILITY,
  therapist_leaves: THERAPIST_LEAVES,
  therapy_rooms: THERAPY_ROOMS,
  emr_records: EMR_RECORDS,
  appointments: APPOINTMENTS,
  panchakarma_plans: PANCHAKARMA_PLANS,
  inventory: INVENTORY,
  billing: BILLING_ITEMS,
}

function init() {
  Object.entries(SEEDS).forEach(([entity, seed]) => {
    if (load(entity) === null) {
      save(entity, seed)
    }
  })
}

init()

export function getAll(entity) {
  let data = load(entity)
  if (data === null && SEEDS[entity]) {
    save(entity, SEEDS[entity])
    data = SEEDS[entity]
  }
  return data ?? []
}

export function getById(entity, id) {
  return getAll(entity).find((item) => item.id === id) ?? null
}

export function addItem(entity, item) {
  const all = getAll(entity)
  all.push(item)
  save(entity, all)
  return item
}

export function updateItem(entity, id, patch) {
  const all = getAll(entity)
  const idx = all.findIndex((item) => item.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...patch }
  save(entity, all)
  return all[idx]
}

export function removeItem(entity, id) {
  const all = getAll(entity)
  const next = all.filter((item) => item.id !== id)
  save(entity, next)
}

export function candidateSlotsFor(patientId, therapyId) {
  const k = `${patientId}-${therapyId}`
  return CANDIDATE_SLOTS[k] ?? []
}

/** Hard reset — re-seeds all entities from scratch (useful for demo & resets). */
export function resetStore() {
  Object.keys(SEEDS).forEach((entity) => {
    save(entity, SEEDS[entity])
  })
}
