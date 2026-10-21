/**
 * Panchakarma Inventory Service.
 * Manages therapeutic oils, herbal decoctions, Basti supplies, Swedana materials, and consumables.
 */

import { getAll, getById, addItem, updateItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { api, remoteReady } from './http.js'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listInventory() {
  if (remoteReady()) return api('/api/inventory')
  await delay()
  return getAll('inventory')
}

export async function getInventoryItem(id) {
  if (remoteReady()) {
    const items = await api('/api/inventory')
    const item = items.find((i) => i.id === id)
    if (!item) {
      const err = new Error('Inventory item not found.')
      err.status = 404
      throw err
    }
    return item
  }
  await delay()
  return getById('inventory', id)
}

export async function addInventoryItem(item) {
  if (remoteReady()) return api('/api/inventory', { method: 'POST', body: item })
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
  if (remoteReady()) {
    return api(`/api/inventory/${id}/stock`, {
      method: 'PATCH',
      body: { currentStock: Number(newStock) },
    })
  }
  await delay()
  return updateItem('inventory', id, { currentStock: Number(newStock) })
}
