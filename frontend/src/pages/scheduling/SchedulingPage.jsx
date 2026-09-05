import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { listPatients } from '../../services/patients.js'
import { listTherapies } from '../../services/therapies.js'
import { listPlans } from '../../services/plans.js'
import { recommendSlots } from '../../services/scheduling.js'
import { confirmAppointment } from '../../services/appointments.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card, { CardHeader } from '../../components/Card.jsx'
import FormField, { Select, Input } from '../../components/FormField.jsx'
import Button from '../../components/Button.jsx'
import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { required, validate } from '../../utils/validation.js'
import { formatDate, formatTime } from '../../utils/date.js'

export default function SchedulingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [patients, setPatients] = useState([])
  const [therapies, setTherapies] = useState([])
  const [plans, setPlans] = useState([])

  const [form, setForm] = useState({
    patientId: location.state?.patientId ?? '',
    therapyId: '',
    treatmentStage: 'Purva Karma',
    sessionNumber: 1,
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
    Promise.all([listPatients(), listTherapies(), listPlans()]).then(([p, t, pl]) => {
      setPatients(p)
      setTherapies(t)
      setPlans(pl)
    })
  }, [])

  // Auto-fill stage & therapy from patient's active plan if present
  useEffect(() => {
    if (form.patientId) {
      const activePlan = plans.find(
        (pl) => pl.patientId === form.patientId && (pl.status === 'In Progress' || pl.status === 'Active'),
      )
      if (activePlan) {
        const matchingTherapy = therapies.find(
          (t) => t.name.toLowerCase().includes(activePlan.primaryPanchakarma?.toLowerCase()) ||
            activePlan.procedureName?.toLowerCase().includes(t.name.toLowerCase()),
        )
        setForm((prev) => ({
          ...prev,
          treatmentStage: activePlan.treatmentStage || prev.treatmentStage,
          sessionNumber: (activePlan.completedSessions || 0) + 1,
          ...(matchingTherapy ? { therapyId: matchingTherapy.id } : {}),
        }))
      }
    }
  }, [form.patientId, plans, therapies])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
    setSlots(null)
    setSelectedSlot(null)
  }

  async function handleSearch(e) {
    e.preventDefault()
    const { errors: errs, hasError } = validate({
      patientId: required(form.patientId, 'Patient'),
      therapyId: required(form.therapyId, 'Therapy procedure'),
    })
    if (hasError) { setErrors(errs); return }

    setSearching(true)
    setSearchError(null)
    setSlots(null)
    setSelectedSlot(null)
    try {
      const results = await recommendSlots({
        patientId: form.patientId,
        therapyId: form.therapyId,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
      })
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
      const activePlan = plans.find((pl) => pl.patientId === form.patientId)
      await confirmAppointment(selectedSlot, {
        patientId: form.patientId,
        therapyId: form.therapyId,
        treatmentStage: form.treatmentStage,
        sessionNumber: Number(form.sessionNumber) || 1,
        planId: activePlan?.id || null,
        createdBy: user.id,
      })
      setConfirmOpen(false)
      setSuccessMsg('Therapy session confirmed and reserved successfully.')
      setSlots(null)
      setSelectedSlot(null)
      setForm({
        patientId: '',
        therapyId: '',
        treatmentStage: 'Purva Karma',
        sessionNumber: 1,
        preferredTime: '',
        preferredDate: '',
      })
    } catch (err) {
      setSearchError(err.message)
      setConfirmOpen(false)
    } finally {
      setConfirming(false)
    }
  }

  const selectedPatient = patients.find((p) => p.id === form.patientId)
  const selectedTherapy = therapies.find((t) => t.id === form.therapyId)
  const recommended = slots?.find((s) => s.recommended) ?? null
  const alternatives = slots?.filter((s) => !s.recommended) ?? []

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="AI-Powered Panchakarma Therapy Scheduler"
        subtitle="Multi-resource constraint engine matching therapy protocol, specialized room, certified therapist, and clinical stage"
      />

      {/* Safety & Clinical Governance Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
        <span className="text-base">🛡️</span>
        <div>
          <span className="font-bold block">Panchakarma Scheduling Governance:</span>
          <p className="text-emerald-800 mt-0.5 leading-relaxed">
            The AI engine strictly validates: (1) Therapy duration &amp; sanitization buffers, (2) Therapist certifications (e.g. Basti/Nasya qualifications), (3) Therapy room type matches (Droni/Swedana box), and (4) Therapist leave calendars. The scheduler never invents slot availability or overrides Vaidya clinical prescriptions.
          </p>
        </div>
      </div>

      {successMsg && (
        <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} className="mb-4" />
      )}
      {searchError && <Alert message={searchError} onClose={() => setSearchError(null)} className="mb-4" />}

      {/* Scheduler Query Form */}
      <Card>
        <CardHeader title="Therapy Session Request &amp; Stage Specification" />
        <form onSubmit={handleSearch} noValidate className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Patient" error={errors.patientId} required>
              <Select
                value={form.patientId}
                onChange={(e) => set('patientId', e.target.value)}
                error={errors.patientId}
              >
                <option value="">— Select Patient —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} · {p.phone} ({p.prakriti || 'N/A'})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Prescribed Procedure / Therapy" error={errors.therapyId} required>
              <Select
                value={form.therapyId}
                onChange={(e) => set('therapyId', e.target.value)}
                error={errors.therapyId}
              >
                <option value="">— Select Therapy —</option>
                {therapies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.defaultDurationMins} min) — {t.requiredRoomType || 'General'}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Treatment Stage in Protocol">
              <Select
                value={form.treatmentStage}
                onChange={(e) => set('treatmentStage', e.target.value)}
              >
                <option value="Purva Karma">Purva Karma (Preparatory: Snehana / Swedana)</option>
                <option value="Pradhana Karma">Pradhana Karma (Primary Cleansing)</option>
                <option value="Paschat Karma">Paschat Karma (Post-Cleanse Rejuvenation)</option>
              </Select>
            </FormField>

            <FormField label="Session Sequence Number">
              <Input
                type="number"
                value={form.sessionNumber}
                onChange={(e) => set('sessionNumber', e.target.value)}
                min={1}
                max={90}
              />
            </FormField>

            <FormField label="Target Date" hint="Leave blank for earliest available clinical slot">
              <Input
                type="date"
                value={form.preferredDate}
                onChange={(e) => set('preferredDate', e.target.value)}
              />
            </FormField>

            <FormField label="Time Window Preference" hint="Ayurvedic diurnal dosha window">
              <Select value={form.preferredTime} onChange={(e) => set('preferredTime', e.target.value)}>
                <option value="">Any Available Time</option>
                <option value="morning">Morning (08:00 – 12:00) — Optimal for Kapha/Vata</option>
                <option value="afternoon">Afternoon (12:00 – 16:00)</option>
              </Select>
            </FormField>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {selectedTherapy && (
              <span className="text-xs text-stone-500">
                Required Facility: <strong className="text-stone-800">{selectedTherapy.requiredRoomType}</strong> · Specialization: <strong className="text-stone-800">{selectedTherapy.requiredTherapistSpecialization || selectedTherapy.name}</strong>
              </span>
            )}
            <Button type="submit" loading={searching}>
              ✨ Compute Constraint-Checked Slots
            </Button>
          </div>
        </form>
      </Card>

      {/* Recommended & Alternative Slots */}
      {slots !== null && (
        <div className="space-y-4">
          {slots.length === 0 ? (
            <EmptyState
              title="No constraint-satisfying slots found"
              description="All specialized rooms of this type or qualified therapists are currently booked or on leave. Try another date or adjust the time window."
            />
          ) : (
            <>
              {recommended && (
                <Card className="border-emerald-300 bg-emerald-50/20 shadow-xs">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide bg-emerald-100 px-2 py-0.5 rounded-full">
                          AI Top-Scored Clinical Slot
                        </span>
                        <span className="text-xs font-semibold text-stone-600">
                          {recommended.treatmentStage} · Session #{form.sessionNumber}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-stone-900">
                        {formatDate(recommended.date)} · {formatTime(recommended.startTime)} – {formatTime(recommended.endTime)}
                      </p>
                    </div>
                    <span className="text-xs bg-emerald-600 text-white font-semibold px-2.5 py-1 rounded-full shadow-xs">
                      100% Constraint Satisfied
                    </span>
                  </div>

                  {/* Slot Details Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-3 p-3 bg-white rounded-xl border border-stone-100">
                    <div>
                      <span className="text-stone-400 block">Certified Therapist</span>
                      <span className="font-bold text-stone-800">{recommended.therapist?.name}</span>
                      <span className="text-[10px] text-stone-500 block">Spec: {recommended.therapist?.specialization}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Assigned Chamber</span>
                      <span className="font-bold text-stone-800">{recommended.room?.name}</span>
                      <span className="text-[10px] text-emerald-700 block font-medium">{recommended.room?.roomType}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Procedure</span>
                      <span className="font-bold text-stone-800">{recommended.therapy?.name}</span>
                      <span className="text-[10px] text-stone-500 block">{recommended.therapy?.defaultDurationMins} minutes</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Therapist Load Today</span>
                      <span className="font-bold text-stone-800">{recommended.therapistWorkload} prior sessions</span>
                      <span className="text-[10px] text-emerald-600 block">✓ Buffer time verified</span>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-600 mb-4 border border-stone-100">
                    <strong className="text-stone-800 font-semibold">Clinical Matching Rationale: </strong>
                    {recommended.reason}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        setSelectedSlot(recommended)
                        setConfirmOpen(true)
                      }}
                    >
                      Confirm This Recommended Slot
                    </Button>
                    {alternatives.length > 0 && (
                      <span className="text-xs text-stone-500">
                        {alternatives.length} verified alternative{alternatives.length !== 1 ? 's' : ''} available below
                      </span>
                    )}
                  </div>
                </Card>
              )}

              {alternatives.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                    Verified Alternative Slots
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {alternatives.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`border rounded-xl p-3.5 transition-all cursor-pointer ${
                          selectedSlot?.id === slot.id
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-bold text-stone-900">
                              {formatDate(slot.date)} · {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                            </p>
                            <p className="text-xs text-stone-500 mt-0.5">
                              ✋ {slot.therapist?.name} · 🏛️ {slot.room?.name}
                            </p>
                          </div>
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSlot(slot)
                              setConfirmOpen(true)
                            }}
                          >
                            Select Slot
                          </Button>
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-2">{slot.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedSlot && (
        <Modal
          open={confirmOpen}
          onClose={() => !confirming && setConfirmOpen(false)}
          title="Confirm Panchakarma Session Reservation"
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={confirming}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} loading={confirming}>
                Confirm &amp; Notify Care Team
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-stone-600">
              Verify the multi-resource allocation details before locking the schedule:
            </p>
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-400">Patient:</span>
                <span className="font-bold text-stone-800">{selectedPatient?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Prescribed Therapy:</span>
                <span className="font-bold text-emerald-800">{selectedSlot.therapy?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Treatment Stage:</span>
                <span className="font-semibold text-stone-700">{form.treatmentStage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Session Number:</span>
                <span className="font-semibold text-stone-700">Session #{form.sessionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Date &amp; Time:</span>
                <span className="font-bold text-stone-800">
                  {formatDate(selectedSlot.date)} ({formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Certified Therapist:</span>
                <span className="font-bold text-stone-800">{selectedSlot.therapist?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Assigned Facility Room:</span>
                <span className="font-bold text-stone-800">{selectedSlot.room?.name}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
