import { describe, expect, it } from 'vitest'
import { createPlan, getPlansForPatient, pickActivePlan } from '../services/plans.js'
import { getAll } from '../mocks/store.js'

describe('treatment plan allocation', () => {
  it('picks the newest in-progress plan for the patient dashboard', () => {
    const active = pickActivePlan([
      { id: 'old', status: 'In Progress', createdAt: '2026-01-01T00:00:00.000Z', procedureName: 'Old' },
      { id: 'new', status: 'In Progress', createdAt: '2026-10-01T00:00:00.000Z', procedureName: 'New' },
      { id: 'done', status: 'Completed', createdAt: '2026-11-01T00:00:00.000Z', procedureName: 'Done' },
    ])
    expect(active.id).toBe('new')
    expect(active.procedureName).toBe('New')
  })

  it('updates the same patient plan so the dashboard shows the allocated protocol', async () => {
    const first = await createPlan(
      {
        patientId: 'patient-1',
        procedureName: 'Yoga Basti Reallocated',
        primaryPanchakarma: 'Basti',
        totalSessions: 11,
        doctorInstructions: 'Updated basti sequence',
        dietPlan: 'Warm mung soup only',
      },
      'user-1',
    )
    const again = await createPlan(
      {
        patientId: 'patient-1',
        procedureName: 'Kati Basti Focus',
        primaryPanchakarma: 'Basti',
        totalSessions: 5,
        doctorInstructions: 'Localized lumbar protocol',
        dietPlan: 'Light khichdi',
      },
      'user-1',
    )
    expect(again.id).toBe(first.id)
    const mine = await getPlansForPatient('patient-1')
    const active = pickActivePlan(mine)
    expect(active.procedureName).toBe('Kati Basti Focus')
    expect(active.totalSessions).toBe(5)
    expect(active.dietPlan).toBe('Light khichdi')
    expect(active.doctorInstructions).toBe('Localized lumbar protocol')
    expect(getAll('panchakarma_plans').filter((plan) => plan.patientId === 'patient-1' && plan.status === 'In Progress').length).toBe(1)
  })
})
