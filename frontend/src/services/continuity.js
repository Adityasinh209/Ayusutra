import { addItem, getAll, getById, updateItem } from '../mocks/store.js'

const SESSION_FEE = 1000

export function pickOpenAppointment(rows) {
  return [...rows]
    .filter((row) => row.status === 'Confirmed' || row.status === 'Scheduled')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Confirmed' ? -1 : 1
      return `${a.date || ''}${a.startTime || ''}`.localeCompare(`${b.date || ''}${b.startTime || ''}`)
    })[0] || null
}

export function ensureClinicalBill({ patientId, appointmentId, planId, packageType = 'Therapy session', sessions = 1 }) {
  const bills = getAll('billing')
  const existing = bills.find((bill) => planId && bill.planId === planId)
    || bills.find((bill) => appointmentId && bill.appointmentId === appointmentId)
    || bills.find((bill) => !appointmentId && bill.patientId === patientId && !bill.planId && !bill.appointmentId && bill.paymentStatus === 'Pending' && !Number(bill.paidAmount))
  const amount = SESSION_FEE * Math.max(Number(sessions) || 1, 1)
  if (existing) {
    const patch = {}
    if (planId && !existing.planId) patch.planId = planId
    if (appointmentId && !existing.appointmentId) patch.appointmentId = appointmentId
    if (planId && existing.paymentStatus === 'Pending' && !Number(existing.paidAmount)) {
      patch.packageType = packageType || existing.packageType
      patch.subtotal = amount
      patch.totalAmount = amount
    }
    return Object.keys(patch).length ? updateItem('billing', existing.id, patch) : existing
  }
  const today = new Date().toISOString().slice(0, 10)
  return addItem('billing', {
    id: `bill-${Date.now()}`,
    invoiceNumber: `INV-${today.slice(0, 4)}-${String(bills.length + 1).padStart(3, '0')}`,
    patientId,
    appointmentId: appointmentId || null,
    planId: planId || null,
    date: today,
    billDate: today,
    packageType,
    items: [],
    subtotal: amount,
    discount: 0,
    taxAmount: 0,
    totalAmount: amount,
    paidAmount: 0,
    paymentStatus: 'Pending',
    paymentMethod: '',
  })
}

export function ensureClinicalFollowup({ patientId, followupDate, planId, therapistId }) {
  if (!followupDate) return null
  const rows = getAll('followups')
  const existing = rows.find((row) => planId && row.planId === planId)
    || rows.find((row) => row.patientId === patientId && row.followupDate === followupDate && row.status === 'Pending')
  if (existing) {
    if (existing.status !== 'Pending') return existing
    return updateItem('followups', existing.id, {
      followupDate,
      ...(planId && !existing.planId ? { planId } : {}),
      ...(therapistId && !existing.therapistId ? { therapistId } : {}),
    })
  }
  return addItem('followups', {
    id: `followup-${Date.now()}`,
    patientId,
    therapistId: therapistId || null,
    planId: planId || null,
    followupDate,
    reminderSent: false,
    status: 'Pending',
  })
}

export function syncVisitRecords(appointment) {
  if (!appointment) return appointment
  const plan = appointment.planId ? getById('panchakarma_plans', appointment.planId) : null
  const therapy = getAll('therapies').find((item) => item.id === appointment.therapyId)
  ensureClinicalBill({
    patientId: appointment.patientId,
    appointmentId: appointment.id,
    planId: appointment.planId,
    packageType: plan?.procedureName || therapy?.name || 'Therapy session',
    sessions: plan?.totalSessions || 1,
  })
  if (plan?.followUpDate) {
    ensureClinicalFollowup({
      patientId: appointment.patientId,
      followupDate: plan.followUpDate,
      planId: plan.id,
      therapistId: appointment.therapistId,
    })
  }
  return appointment
}
