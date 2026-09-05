/**
 * Panchakarma Billing & Treatment Package Service.
 * Manages package charges, therapy sessions, medicated consumables, and payment tracking.
 */

import { getAll, getById, addItem, updateItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listBills() {
  await delay()
  return getAll('billing').sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  )
}

export async function getBill(id) {
  await delay()
  return getById('billing', id)
}

export async function createBill(data) {
  await delay()
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(getAll('billing').length + 1).padStart(3, '0')}`
  const bill = {
    id: generateId('bill'),
    invoiceNumber,
    date: new Date().toISOString().slice(0, 10),
    ...data,
  }
  return addItem('billing', bill)
}

export async function updatePaymentStatus(id, { paymentStatus, paidAmount }) {
  await delay()
  return updateItem('billing', id, { paymentStatus, paidAmount })
}
