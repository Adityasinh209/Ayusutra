import { useEffect, useState } from 'react'
import { listBills, createBill, updatePaymentStatus } from '../../services/billing.js'
import { listPatients } from '../../services/patients.js'
import { listPlans } from '../../services/plans.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card from '../../components/Card.jsx'
import Table from '../../components/Table.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Modal from '../../components/Modal.jsx'
import FormField, { Input, Select } from '../../components/FormField.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import Alert from '../../components/Alert.jsx'
import { formatDate } from '../../utils/date.js'

export default function BillingPage() {
  const [bills, setBills] = useState([])
  const [patients, setPatients] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // New Invoice Form
  const [newBill, setNewBill] = useState({
    patientId: '',
    planId: '',
    packageType: 'Panchakarma Treatment Package (7-14 Days)',
    consultationFee: 800,
    therapyCharges: 10500,
    consumableCharges: 2500,
    discount: 0,
    paymentMethod: 'UPI / Digital',
    paymentStatus: 'Paid',
  })

  async function loadData() {
    try {
      const [allBills, allPatients, allPlans] = await Promise.all([
        listBills(),
        listPatients(),
        listPlans(),
      ])
      setBills(allBills)
      setPatients(allPatients)
      setPlans(allPlans)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreateInvoice(e) {
    e.preventDefault()
    if (!newBill.patientId) return
    setCreating(true)

    const sub = Number(newBill.consultationFee) + Number(newBill.therapyCharges) + Number(newBill.consumableCharges)
    const disc = Number(newBill.discount) || 0
    const tax = Math.round((sub - disc) * 0.05)
    const total = sub - disc + tax

    try {
      await createBill({
        patientId: newBill.patientId,
        planId: newBill.planId || null,
        packageType: newBill.packageType,
        items: [
          { description: 'Vaidya Initial Assessment & Ashtavidha Pariksha', amount: Number(newBill.consultationFee) },
          { description: 'Panchakarma Multi-Session Procedures & Shala Occupancy', amount: Number(newBill.therapyCharges) },
          { description: 'Medicated Oils, Decoctions & Sterile Consumables', amount: Number(newBill.consumableCharges) },
        ],
        subtotal: sub,
        discount: disc,
        taxAmount: tax,
        totalAmount: total,
        paidAmount: newBill.paymentStatus === 'Paid' ? total : Math.round(total / 2),
        paymentStatus: newBill.paymentStatus,
        paymentMethod: newBill.paymentMethod,
      })
      setModalOpen(false)
      setSuccess('Panchakarma invoice generated successfully.')
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleTogglePaid(bill) {
    const nextStatus = bill.paymentStatus === 'Paid' ? 'Pending' : 'Paid'
    try {
      await updatePaymentStatus(bill.id, {
        paymentStatus: nextStatus,
        paidAmount: nextStatus === 'Paid' ? bill.totalAmount : 0,
      })
      await loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))

  const columns = [
    {
      key: 'invoice',
      label: 'Invoice # & Date',
      render: (r) => (
        <div>
          <span className="font-bold text-stone-900 text-xs block">{r.invoiceNumber}</span>
          <span className="text-[11px] text-stone-500">{formatDate(r.date)}</span>
        </div>
      ),
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (r) => (
        <div>
          <span className="font-bold text-stone-800 text-xs block">
            {patientMap[r.patientId]?.fullName || 'Patient'}
          </span>
          <span className="text-[10px] text-stone-400">
            {patientMap[r.patientId]?.phone}
          </span>
        </div>
      ),
    },
    {
      key: 'package',
      label: 'Panchakarma Treatment Package',
      render: (r) => (
        <div>
          <span className="text-xs font-semibold text-emerald-900 block">{r.packageType}</span>
          <span className="text-[10px] text-stone-500">Method: {r.paymentMethod}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Package Total',
      render: (r) => (
        <div className="text-xs">
          <span className="font-bold text-stone-900">₹{r.totalAmount?.toLocaleString()}</span>
          {r.discount > 0 && (
            <span className="text-[10px] text-emerald-700 block">Saved ₹{r.discount}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Payment Status',
      render: (r) => <Badge label={r.paymentStatus} />,
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <Button
          size="xs"
          variant="secondary"
          onClick={() => handleTogglePaid(r)}
        >
          {r.paymentStatus === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
        </Button>
      ),
    },
  ]

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panchakarma Treatment Billing &amp; Packages"
        subtitle="Manage clinical consultation fees, multi-session therapy packages, medicated oil charges, and payment settlements"
        action={
          <Button onClick={() => setModalOpen(true)}>
            + Generate Package Bill
          </Button>
        }
      />

      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-4" />}

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <span className="text-xs text-stone-500 font-medium">Total Billed Revenue</span>
          <p className="text-xl font-bold text-stone-900 mt-1">
            ₹{bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}
          </p>
        </Card>
        <Card>
          <span className="text-xs text-stone-500 font-medium">Settled / Collected</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            ₹{bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0).toLocaleString()}
          </p>
        </Card>
        <Card>
          <span className="text-xs text-stone-500 font-medium">Active Treatment Packages</span>
          <p className="text-xl font-bold text-stone-900 mt-1">{bills.length} Invoices</p>
        </Card>
      </div>

      <Card>
        <Table columns={columns} rows={bills} emptyMessage="No billing records found." />
      </Card>

      {/* New Invoice Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate Panchakarma Treatment Bill"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} loading={creating}>Create Invoice</Button>
          </>
        }
      >
        <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
          <FormField label="Patient" required>
            <Select
              value={newBill.patientId}
              onChange={(e) => setNewBill({ ...newBill, patientId: e.target.value })}
            >
              <option value="">— Select Patient —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Panchakarma Package Description">
            <Input
              value={newBill.packageType}
              onChange={(e) => setNewBill({ ...newBill, packageType: e.target.value })}
              placeholder="e.g. Shirodhara 7-Day Rejuvenation Package"
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Consultation (₹)">
              <Input
                type="number"
                value={newBill.consultationFee}
                onChange={(e) => setNewBill({ ...newBill, consultationFee: e.target.value })}
              />
            </FormField>
            <FormField label="Therapies (₹)">
              <Input
                type="number"
                value={newBill.therapyCharges}
                onChange={(e) => setNewBill({ ...newBill, therapyCharges: e.target.value })}
              />
            </FormField>
            <FormField label="Medicines & Oils (₹)">
              <Input
                type="number"
                value={newBill.consumableCharges}
                onChange={(e) => setNewBill({ ...newBill, consumableCharges: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Discount (₹)">
              <Input
                type="number"
                value={newBill.discount}
                onChange={(e) => setNewBill({ ...newBill, discount: e.target.value })}
              />
            </FormField>
            <FormField label="Payment Method">
              <Select
                value={newBill.paymentMethod}
                onChange={(e) => setNewBill({ ...newBill, paymentMethod: e.target.value })}
              >
                <option value="UPI / Digital">UPI / Digital</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </Select>
            </FormField>
            <FormField label="Payment Status">
              <Select
                value={newBill.paymentStatus}
                onChange={(e) => setNewBill({ ...newBill, paymentStatus: e.target.value })}
              >
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
              </Select>
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  )
}
