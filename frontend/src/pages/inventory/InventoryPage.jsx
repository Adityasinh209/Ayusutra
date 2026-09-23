import { useEffect, useState } from 'react'
import { listInventory, updateStock, addInventoryItem } from '../../services/inventory.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card from '../../components/Card.jsx'
import Table from '../../components/Table.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Modal from '../../components/Modal.jsx'
import FormField, { Input, Select, Textarea } from '../../components/FormField.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import Alert from '../../components/Alert.jsx'

const CATEGORIES = [
  'All Categories',
  'Therapeutic Oils',
  'Herbal Preparations',
  'Basti Materials',
  'Therapy Consumables',
  'Swedana Materials',
]

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [modalOpen, setModalOpen] = useState(false)
  const [stockEditTarget, setStockEditTarget] = useState(null)
  const [newStockVal, setNewStockVal] = useState('')
  const [savingStock, setSavingStock] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // New Item State
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Therapeutic Oils',
    unit: 'Liters',
    currentStock: 10,
    minThreshold: 5,
    costPerUnit: 500,
    indications: '',
  })
  const [creating, setCreating] = useState(false)

  async function loadData() {
    try {
      const data = await listInventory()
      setItems(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleStockUpdate(e) {
    e.preventDefault()
    if (!stockEditTarget || newStockVal === '') return
    setSavingStock(true)
    try {
      await updateStock(stockEditTarget.id, Number(newStockVal))
      setStockEditTarget(null)
      setNewStockVal('')
      setSuccess('Stock balance updated successfully.')
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingStock(false)
    }
  }

  async function handleCreateItem(e) {
    e.preventDefault()
    if (!newItem.name) return
    setCreating(true)
    try {
      await addInventoryItem(newItem)
      setModalOpen(false)
      setNewItem({
        name: '',
        category: 'Therapeutic Oils',
        unit: 'Liters',
        currentStock: 10,
        minThreshold: 5,
        costPerUnit: 500,
        indications: '',
      })
      setSuccess('New Panchakarma supply item added to inventory.')
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const filtered = categoryFilter === 'All Categories'
    ? items
    : items.filter((i) => i.category === categoryFilter)

  const columns = [
    {
      key: 'name',
      label: 'Supply / Medicinal Formulation',
      render: (r) => (
        <div>
          <span className="font-bold text-stone-900 text-xs block">{r.name}</span>
          <span className="text-[10.5px] text-stone-500 line-clamp-1">{r.indications}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (r) => (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
          {r.category}
        </span>
      ),
    },
    {
      key: 'currentStock',
      label: 'Current Stock',
      render: (r) => {
        const isLow = r.currentStock <= r.minThreshold
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold text-xs ${isLow ? 'text-red-600' : 'text-stone-900'}`}>
              {r.currentStock} {r.unit}
            </span>
            {isLow && (
              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                Low Stock
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'minThreshold',
      label: 'Reorder Level',
      render: (r) => <span className="text-xs text-stone-500">{r.minThreshold} {r.unit}</span>,
    },
    {
      key: 'costPerUnit',
      label: 'Unit Cost',
      render: (r) => <span className="text-xs font-medium text-stone-700">₹{r.costPerUnit} / {r.unit}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <Button
          size="xs"
          variant="secondary"
          onClick={() => {
            setStockEditTarget(r)
            setNewStockVal(String(r.currentStock))
          }}
        >
          Update Stock
        </Button>
      ),
    },
  ]

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panchakarma Herbal Inventory &amp; Consumables"
        subtitle="Manage therapeutic oils, raw herbs, sterile Basti materials, Swedana items, and therapy supplies"
        action={
          <Button onClick={() => setModalOpen(true)}>
            + Add Supply Item
          </Button>
        }
      />

      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-4" />}

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-stone-500 font-semibold mr-1">Classification:</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              categoryFilter === cat
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <Card>
        <Table columns={columns} rows={filtered} emptyMessage="No inventory items found." />
      </Card>

      {/* Update Stock Modal */}
      {stockEditTarget && (
        <Modal
          open={!!stockEditTarget}
          onClose={() => setStockEditTarget(null)}
          title={`Adjust Stock: ${stockEditTarget.name}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setStockEditTarget(null)}>Cancel</Button>
              <Button onClick={handleStockUpdate} loading={savingStock}>Save Balance</Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-stone-600">
              Record physical inventory count or therapy session deductions for <strong>{stockEditTarget.name}</strong>.
            </p>
            <FormField label={`Current Available Stock (${stockEditTarget.unit})`}>
              <Input
                type="number"
                value={newStockVal}
                onChange={(e) => setNewStockVal(e.target.value)}
                min={0}
              />
            </FormField>
          </div>
        </Modal>
      )}

      {/* Add New Item Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Panchakarma Supply Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateItem} loading={creating}>Add Item</Button>
          </>
        }
      >
        <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
          <FormField label="Item / Herbal Formulation Name" required>
            <Input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="e.g. Ksheerabala Taila 101 Aavarti"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <Select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              >
                <option value="Therapeutic Oils">Therapeutic Oils</option>
                <option value="Herbal Preparations">Herbal Preparations</option>
                <option value="Basti Materials">Basti Materials</option>
                <option value="Therapy Consumables">Therapy Consumables</option>
                <option value="Swedana Materials">Swedana Materials</option>
              </Select>
            </FormField>
            <FormField label="Measurement Unit">
              <Input
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="Liters / Kg / Sets"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Initial Stock">
              <Input
                type="number"
                value={newItem.currentStock}
                onChange={(e) => setNewItem({ ...newItem, currentStock: e.target.value })}
              />
            </FormField>
            <FormField label="Min Alert Level">
              <Input
                type="number"
                value={newItem.minThreshold}
                onChange={(e) => setNewItem({ ...newItem, minThreshold: e.target.value })}
              />
            </FormField>
            <FormField label="Unit Cost (₹)">
              <Input
                type="number"
                value={newItem.costPerUnit}
                onChange={(e) => setNewItem({ ...newItem, costPerUnit: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Clinical Indications / Prescribed Therapies">
            <Textarea
              value={newItem.indications}
              onChange={(e) => setNewItem({ ...newItem, indications: e.target.value })}
              placeholder="Indicated for Abhyanga, Basti, joint stiffness..."
              rows={2}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  )
}
