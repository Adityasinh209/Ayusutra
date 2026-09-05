/**
 * Panchakarma Inventory Service.
 * Manages therapeutic oils, herbal decoctions, Basti supplies, Swedana materials, and consumables.
 */

import { getAll, getById, addItem, updateItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listInventory() {
  await delay()
  return getAll('inventory')
}

export async function getInventoryItem(id) {
  await delay()
  return getById('inventory', id)
}

export async function addInventoryItem(item) {
  await delay()
  const record = {
    id: generateId('inv'),
    ...item,
    currentStock: Number(item.currentStock) || 0,
    minThreshold: Number(item.minThreshold) || 10,
    costPerUnit: Number(item.costPerUnit) || 0,
  }
  return addItem('inventory', record)
}

export async function updateStock(id, newStock) {
  await delay()
  return updateItem('inventory', id, { currentStock: Number(newStock) })
}
