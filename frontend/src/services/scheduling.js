/**
 * Scheduling service.
 * Phase 2 mapping: POST /api/scheduling/recommend
 *
 * Returns pre-generated candidate slots from mock data, enriched with
 * therapist and room details. In Phase 2 this becomes a real call to the
 * FastAPI scheduling engine which performs conflict detection, workload
 * balancing, and a Gemini recommendation layer.
 */

import { candidateSlotsFor } from '../mocks/store.js'
import { getTherapist } from './therapists.js'
import { getRoom } from './rooms.js'
import { getTherapy } from './therapies.js'

function delay(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function recommendSlots({ patientId, therapyId }) {
  await delay()

  const rawSlots = candidateSlotsFor(patientId, therapyId)
  if (!rawSlots.length) {
    return []
  }

  const therapy = await getTherapy(therapyId)

  const enriched = await Promise.all(
    rawSlots.map(async (slot) => {
      const therapist = await getTherapist(slot.therapistId)
      const room = await getRoom(slot.roomId)
      return { ...slot, therapist, room, therapy }
    }),
  )

  return enriched
}
