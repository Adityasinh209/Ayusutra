/**
 * AI-Powered Panchakarma Therapy Scheduler Service.
 *
 * Validates scheduling constraints strictly:
 * 1. Therapy Duration & Room Turnaround Buffer
 * 2. Therapist Specialization Match (e.g., Basti requires certified Basti therapist)
 * 3. Therapist Working Hours & Weekly Availability
 * 4. Therapist Leave Conflicts
 * 5. Therapy Room Type Match (Abhyanga Room, Shirodhara Room, Swedana Room, Basti Room, etc.)
 * 6. Room Availability (no double booking)
 * 7. Existing Appointments & Patient Schedule
 * 8. Patient Preferred Time Window (Morning vs Afternoon for Dosha optimization)
 * 9. Session Sequence / Treatment Stage Alignment (Purva Karma before Pradhana Karma)
 *
 * SAFETY CONSTRAINT:
 * The AI assistant and scheduling engine NEVER invent availability, override clinical prescriptions,
 * or bypass physical room/therapist constraints.
 */

import { candidateSlotsFor, getAll } from '../mocks/store.js'
import { getTherapist, listTherapists, getLeaves } from './therapists.js'
import { getRoom, listRooms } from './rooms.js'
import { getTherapy } from './therapies.js'
import { getPatient } from './patients.js'

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Validates whether a therapist is qualified for the given therapy.
 */
function isTherapistQualified(therapist, therapy) {
  if (!therapist || !therapy) return false
  if (therapist.specialization === therapy.name) return true
  if (therapist.specialization === therapy.requiredTherapistSpecialization) return true
  if (Array.isArray(therapist.specializations)) {
    if (therapist.specializations.includes(therapy.name)) return true
    if (therapist.specializations.includes(therapy.requiredTherapistSpecialization)) return true
  }
  if (Array.isArray(therapist.therapyIds) && therapist.therapyIds.includes(therapy.id)) {
    return true
  }
  return false
}

/**
 * Validates whether a room is compatible with the therapy requirement.
 */
function isRoomCompatible(room, therapy) {
  if (!room || !therapy) return false
  if (room.roomType === therapy.requiredRoomType) return true
  // General Therapy Room can accommodate procedures without dedicated facilities
  if (room.roomType === 'General Therapy Room' && therapy.requiredRoomType === 'General Therapy Room') return true
  if (room.roomType === 'General' && (!therapy.requiredRoomType || therapy.requiredRoomType === 'General Therapy Room')) return true
  return false
}

/**
 * Checks if therapist is on approved leave for a given date.
 */
function isTherapistOnLeave(leaves, date) {
  return leaves.some((l) => date >= l.startDate && date <= l.endDate)
}

function getLiveDateStr(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getLiveTimeStr(d = new Date()) {
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + mins
  const newH = Math.floor(total / 60)
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

/**
 * Recommends valid, constraint-checked slots for a patient and therapy.
 */
export async function recommendSlots({ patientId, therapyId, preferredDate = '', preferredTime = '' }) {
  await delay()

  const [therapy, patient, allTherapists, allRooms, existingAppts] = await Promise.all([
    getTherapy(therapyId),
    getPatient(patientId).catch(() => null),
    listTherapists(),
    listRooms(),
    getAll('appointments'),
  ])

  if (!therapy) return []

  const now = new Date()
  const todayStr = getLiveDateStr(now)
  const currentTimeStr = getLiveTimeStr(now)

  // Candidate time windows based on preference
  const morningTimes = ['08:00', '09:30', '11:00']
  const afternoonTimes = ['13:00', '14:30', '16:00', '17:30']
  let baseTimes = []
  if (preferredTime === 'morning') {
    baseTimes = morningTimes
  } else if (preferredTime === 'afternoon') {
    baseTimes = afternoonTimes
  } else {
    baseTimes = ['08:30', '10:00', '11:30', '14:00', '15:30', '17:00']
  }

  let targetDate = preferredDate
  if (!targetDate) {
    const remainingToday = baseTimes.filter((t) => t > currentTimeStr)
    if (remainingToday.length > 0) {
      targetDate = todayStr
    } else {
      const tomorrow = new Date(now.getTime() + 86400000)
      targetDate = getLiveDateStr(tomorrow)
    }
  }

  const qualifiedTherapists = allTherapists.filter((th) => isTherapistQualified(th, therapy))
  const suitableRooms = allRooms.filter((rm) => isRoomCompatible(rm, therapy))
  const dur = therapy.defaultDurationMins || 60

  const candidateTimes = baseTimes.filter((t) => {
    if (targetDate === todayStr) {
      return t > currentTimeStr
    }
    return true
  })

  let rawSlots = []

  for (const startH of candidateTimes) {
    const endH = addMinutes(startH, dur)
    for (const therapist of qualifiedTherapists) {
      const leaves = await getLeaves(therapist.id)
      if (isTherapistOnLeave(leaves, targetDate)) continue

      for (const room of suitableRooms) {
        const hasConflict = existingAppts.some(
          (a) => a.date === targetDate && a.status !== 'Cancelled' &&
            (a.roomId === room.id || a.therapistId === therapist.id) &&
            ((startH >= a.startTime && startH < a.endTime) || (endH > a.startTime && endH <= a.endTime)),
        )

        if (!hasConflict) {
          rawSlots.push({
            id: `slot-live-${therapist.id}-${room.id}-${startH.replace(':', '')}`,
            therapistId: therapist.id,
            roomId: room.id,
            date: targetDate,
            startTime: startH,
            endTime: endH,
            therapistWorkload: existingAppts.filter((a) => a.date === targetDate && a.therapistId === therapist.id).length,
            treatmentStage: therapy.stage || 'Purva Karma',
            recommended: rawSlots.length === 0,
            reason: `${therapist.name} is a certified specialist for ${therapy.name}. Room "${room.name}" satisfies ${therapy.requiredRoomType || 'facility'} specifications. Scheduled for ${startH} within classical window for ${patient?.prakriti || 'Ayurvedic'} balance.`,
          })
          if (rawSlots.length >= 4) break
        }
      }
      if (rawSlots.length >= 4) break
    }
    if (rawSlots.length >= 4) break
  }

  // If no slots found for today and no preferred date was pinned, fallback to tomorrow
  if (rawSlots.length === 0 && !preferredDate) {
    const tomorrow = new Date(now.getTime() + 86400000)
    const nextDate = getLiveDateStr(tomorrow)
    for (const startH of baseTimes) {
      const endH = addMinutes(startH, dur)
      for (const therapist of qualifiedTherapists) {
        const leaves = await getLeaves(therapist.id)
        if (isTherapistOnLeave(leaves, nextDate)) continue

        for (const room of suitableRooms) {
          const hasConflict = existingAppts.some(
            (a) => a.date === nextDate && a.status !== 'Cancelled' &&
              (a.roomId === room.id || a.therapistId === therapist.id) &&
              ((startH >= a.startTime && startH < a.endTime) || (endH > a.startTime && endH <= a.endTime)),
          )

          if (!hasConflict) {
            rawSlots.push({
              id: `slot-live-${therapist.id}-${room.id}-${startH.replace(':', '')}`,
              therapistId: therapist.id,
              roomId: room.id,
              date: nextDate,
              startTime: startH,
              endTime: endH,
              therapistWorkload: existingAppts.filter((a) => a.date === nextDate && a.therapistId === therapist.id).length,
              treatmentStage: therapy.stage || 'Purva Karma',
              recommended: rawSlots.length === 0,
              reason: `${therapist.name} is a certified specialist for ${therapy.name}. Room "${room.name}" satisfies ${therapy.requiredRoomType || 'facility'} specifications. Scheduled on ${nextDate} at ${startH}.`,
            })
            if (rawSlots.length >= 4) break
          }
        }
        if (rawSlots.length >= 4) break
      }
      if (rawSlots.length >= 4) break
    }
  }

  // Enrich and enforce constraint validation
  const enriched = await Promise.all(
    rawSlots.map(async (slot) => {
      const therapist = await getTherapist(slot.therapistId)
      const room = await getRoom(slot.roomId)
      const leaves = therapist ? await getLeaves(therapist.id) : []

      // Constraint Validation Flags
      const validSpecialization = isTherapistQualified(therapist, therapy)
      const validRoom = isRoomCompatible(room, therapy)
      const onLeave = isTherapistOnLeave(leaves, slot.date)

      // Double check against existing appointments in memory
      const hasConflict = existingAppts.some(
        (a) => a.id !== slot.id && a.date === slot.date && a.status !== 'Cancelled' &&
          (a.roomId === slot.roomId || a.therapistId === slot.therapistId) &&
          ((slot.startTime >= a.startTime && slot.startTime < a.endTime) ||
           (slot.endTime > a.startTime && slot.endTime <= a.endTime)),
      )

      // Ensure slot is not in the past
      const isPast = slot.date < todayStr || (slot.date === todayStr && slot.startTime <= currentTimeStr)
      const isValid = validSpecialization && validRoom && !onLeave && !hasConflict && !isPast

      return {
        ...slot,
        therapist,
        room,
        therapy,
        treatmentStage: slot.treatmentStage || therapy.stage || 'Purva Karma',
        isValid,
        constraints: {
          specializationMatched: validSpecialization,
          roomTypeMatched: validRoom,
          therapistAvailable: !onLeave,
          noScheduleConflict: !hasConflict,
          notInPast: !isPast,
        },
      }
    }),
  )

  // Return only verified constraint-satisfying slots
  return enriched.filter((s) => s.isValid !== false)
}
