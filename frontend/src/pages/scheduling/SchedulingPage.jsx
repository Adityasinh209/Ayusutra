import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { listPatients } from '../../services/patients.js'
import { listTherapies } from '../../services/therapies.js'
import { recommendSlots } from '../../services/scheduling.js'
import { confirmAppointment } from '../../services/appointments.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card, { CardHeader } from '../../components/Card.jsx'
import FormField, { Select, Input } from '../../components/FormField.jsx'
import Button from '../../components/Button.jsx'
import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { required, validate } from '../../utils/validation.js'
import { formatDate, formatTime } from '../../utils/date.js'

export default function SchedulingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [patients, setPatients] = useState([])
  const [therapies, setTherapies] = useState([])

  const [form, setForm] = useState({
    patientId: location.state?.patientId ?? '',
    therapyId: '',
    preferredTime: '',
    preferredDate: '',
  })
  const [errors, setErrors] = useState({})

  const [searching, setSearching] = useState(false)
  const [slots, setSlots] = useState(null)
  const [searchError, setSearchError] = useState(null)

  const [selectedSlot, setSelectedSlot] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    Promise.all([listPatients(), listTherapies()]).then(([p, t]) => {
      setPatients(p)
      setTherapies(t)
    })
  }, [])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
    // Clear previous results when inputs change
    setSlots(null)
    setSelectedSlot(null)
  }

  async function handleSearch(e) {
    e.preventDefault()
    const { errors: errs, hasError } = validate({
      patientId: required(form.patientId, 'Patient'),
      therapyId: required(form.therapyId, 'Therapy'),
    })
    if (hasError) { setErrors(errs); return }

    setSearching(true)
    setSearchError(null)
    setSlots(null)
    setSelectedSlot(null)
    try {
      const results = await recommendSlots({ patientId: form.patientId, therapyId: form.therapyId })
      setSlots(results)
      if (results.length) setSelectedSlot(results.find((s) => s.recommended) ?? results[0])
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearching(false)
    }
  }

  async function handleConfirm() {
    if (!selectedSlot) return
    setConfirming(true)
    try {
      await confirmAppointment(selectedSlot, {
        patientId: form.patientId,
        therapyId: form.therapyId,
        createdBy: user.id,
      })
      setConfirmOpen(false)
      setSuccessMsg('Appointment confirmed successfully.')
      setSlots(null)
      setSelectedSlot(null)
      setForm({ patientId: '', therapyId: '', preferredTime: '', preferredDate: '' })
    } catch (err) {
      setSearchError(err.message)
      setConfirmOpen(false)
    } finally {
      setConfirming(false)
    }
  }

  const recommended = slots?.find((s) => s.recommended) ?? null
  const alternatives = slots?.filter((s) => !s.recommended) ?? []

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Schedule Therapy"
        subtitle="Find and confirm available therapy slots"
      />

      {successMsg && (
        <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} className="mb-4" />
      )}
      {searchError && <Alert message={searchError} onClose={() => setSearchError(null)} className="mb-4" />}

      {/* Search form */}
      <Card className="mb-6">
        <CardHeader title="Therapy Request" />
        <form onSubmit={handleSearch} noValidate className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Patient" error={errors.patientId} required>
              <Select
                value={form.patientId}
                onChange={(e) => set('patientId', e.target.value)}
                error={errors.patientId}
              >
                <option value="">— Select patient —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName} · {p.phone}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Therapy" error={errors.therapyId} required>
              <Select
                value={form.therapyId}
                onChange={(e) => set('therapyId', e.target.value)}
                error={errors.therapyId}
              >
                <option value="">— Select therapy —</option>
                {therapies.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.defaultDurationMins} min)</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Preferred Date" hint="Optional — leave blank for earliest available">
              <Input
                type="date"
                value={form.preferredDate}
                onChange={(e) => set('preferredDate', e.target.value)}
              />
            </FormField>
            <FormField label="Preferred Time" hint="Optional — morning / afternoon">
              <Select value={form.preferredTime} onChange={(e) => set('preferredTime', e.target.value)}>
                <option value="">No preference</option>
                <option value="morning">Morning (before 12:00)</option>
                <option value="afternoon">Afternoon (12:00 onward)</option>
              </Select>
            </FormField>
          </div>
          <Button type="submit" loading={searching}>Find Available Slots</Button>
        </form>
      </Card>

      {/* Results */}
      {slots !== null && (
        <>
          {slots.length === 0 ? (
            <EmptyState
              title="No available slots"
              description="No suitable therapist or room is available for the selected therapy. Try a different date or therapy."
            />
          ) : (
            <div className="space-y-4">
              {recommended && (
                <Card className="border-green-200">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">AI Recommended Slot</p>
                      <p className="text-base font-semibold text-gray-900">
                        {formatDate(recommended.date)} · {formatTime(recommended.startTime)} – {formatTime(recommended.endTime)}
                      </p>
                    </div>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200 whitespace-nowrap">Best Match</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm mb-3">
                    <SlotDetail label="Therapist" value={recommended.therapist?.name} />
                    <SlotDetail label="Room" value={recommended.room?.name} />
                    <SlotDetail label="Therapy" value={recommended.therapy?.name} />
                    <SlotDetail label="Workload" value={`${recommended.therapistWorkload} appointments today`} />
                  </div>
                  <div className="bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600 mb-4">
                    <span className="font-medium text-gray-700">Reason: </span>{recommended.reason}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => { setSelectedSlot(recommended); setConfirmOpen(true) }}
                    >
                      Confirm This Slot
                    </Button>
                    {alternatives.length > 0 && (
                      <span className="text-sm text-gray-400 self-center">{alternatives.length} alternative{alternatives.length !== 1 ? 's' : ''} below</span>
                    )}
                  </div>
                </Card>
              )}

              {alternatives.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Alternative Slots</p>
                  <div className="space-y-3">
                    {alternatives.map((slot) => (
                      <AlternativeSlot
                        key={slot.id}
                        slot={slot}
                        selected={selectedSlot?.id === slot.id}
                        onSelect={() => setSelectedSlot(slot)}
                        onConfirm={() => { setSelectedSlot(slot); setConfirmOpen(true) }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Confirm dialog */}
      {selectedSlot && (
        <Modal
          open={confirmOpen}
          onClose={() => !confirming && setConfirmOpen(false)}
          title="Confirm Appointment"
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={confirming}>Cancel</Button>
              <Button onClick={handleConfirm} loading={confirming}>Confirm Appointment</Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="text-gray-600">Please review the details before confirming.</p>
            <div className="bg-gray-50 rounded-md p-4 space-y-2">
              <Row label="Patient" value={patients.find((p) => p.id === form.patientId)?.fullName} />
              <Row label="Therapy" value={selectedSlot.therapy?.name} />
              <Row label="Date" value={formatDate(selectedSlot.date)} />
              <Row label="Time" value={`${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}`} />
              <Row label="Therapist" value={selectedSlot.therapist?.name} />
              <Row label="Room" value={selectedSlot.room?.name} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SlotDetail({ label, value }) {
  return (
    <div>
      <span className="text-gray-400">{label}: </span>
      <span className="text-gray-700 font-medium">{value ?? '—'}</span>
    </div>
  )
}

function AlternativeSlot({ slot, selected, onSelect, onConfirm }) {
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-colors ${selected ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {formatDate(slot.date)} · {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{slot.therapist?.name} · {slot.room?.name}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onConfirm() }}>
          Select
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-2">{slot.reason}</p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-24 shrink-0 text-gray-400">{label}</span>
      <span className="font-medium text-gray-800">{value ?? '—'}</span>
    </div>
  )
}
