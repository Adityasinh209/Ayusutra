import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { listPatients, getPatient } from '../../services/patients.js'
import { listTherapies } from '../../services/therapies.js'
import { createEmr } from '../../services/emr.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card, { CardHeader } from '../../components/Card.jsx'
import FormField, { Input, Textarea, Select } from '../../components/FormField.jsx'
import Button from '../../components/Button.jsx'
import Alert from '../../components/Alert.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import { required, validate } from '../../utils/validation.js'
import { calculateAge } from '../../utils/date.js'

const INITIAL_FORM = {
  symptoms: '',
  diagnosis: '',
  treatmentPlan: '',
  therapyId: '',
  therapyDurationMins: '',
  numberOfSessions: '',
  treatmentStage: 'Purva Karma',
  purvaKarmaInstructions: '',
  paschatKarmaInstructions: '',
  dietaryInstructions: '',
  doctorNotes: '',
  followUpDate: '',
  ashtavidhaNadi: 'Sarpagati (Vata-dominant)',
  ashtavidhaMutra: 'Prakrita (Normal)',
  ashtavidhaMala: 'Madhyama',
  ashtavidhaJihva: 'Niram (Clean)',
  ashtavidhaShabda: 'Spashta (Clear)',
  ashtavidhaSparsha: 'Prakrita (Normal warm)',
  ashtavidhaDruk: 'Normal vision',
  ashtavidhaAakruti: 'Madhyama (Medium)',
}

export default function ConsultationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [patients, setPatients] = useState([])
  const [therapies, setTherapies] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(location.state?.patientId ?? '')
  const [patient, setPatient] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    Promise.all([listPatients(), listTherapies()])
      .then(([p, t]) => {
        setPatients(p)
        setTherapies(t)
      })
      .finally(() => setInitLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedPatientId) {
      setPatient(null)
      return
    }
    getPatient(selectedPatientId)
      .then((p) => {
        setPatient(p)
        if (p.chiefComplaint && !form.symptoms) {
          setForm((prev) => ({ ...prev, symptoms: p.chiefComplaint }))
        }
      })
      .catch(() => setPatient(null))
  }, [selectedPatientId])

  useEffect(() => {
    const therapy = therapies.find((t) => t.id === form.therapyId)
    if (therapy) {
      setForm((prev) => ({
        ...prev,
        therapyDurationMins: String(therapy.defaultDurationMins),
        numberOfSessions: String(therapy.defaultSessionCount || 7),
        treatmentStage: therapy.stage || prev.treatmentStage,
      }))
    }
  }, [form.therapyId, therapies])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { errors: errs, hasError } = validate({
      patient: required(selectedPatientId, 'Patient'),
      symptoms: required(form.symptoms, 'Presenting symptoms & complaints'),
      diagnosis: required(form.diagnosis, 'Ayurvedic diagnosis / Dosha vikriti'),
      treatmentPlan: required(form.treatmentPlan, 'Panchakarma protocol outline'),
      therapyId: required(form.therapyId, 'Prescribed therapy procedure'),
      therapyDurationMins: required(form.therapyDurationMins, 'Session duration'),
      numberOfSessions: required(form.numberOfSessions, 'Number of sessions'),
    })
    if (hasError) {
      setErrors(errs)
      return
    }

    setLoading(true)
    setSubmitError(null)
    try {
      await createEmr(
        {
          patientId: selectedPatientId,
          ...form,
          therapyDurationMins: Number(form.therapyDurationMins),
          numberOfSessions: Number(form.numberOfSessions),
          ashtavidhaPariksha: {
            nadi: form.ashtavidhaNadi,
            mutra: form.ashtavidhaMutra,
            mala: form.ashtavidhaMala,
            jihva: form.ashtavidhaJihva,
            shabda: form.ashtavidhaShabda,
            sparsha: form.ashtavidhaSparsha,
            druk: form.ashtavidhaDruk,
            aakruti: form.ashtavidhaAakruti,
          },
        },
        user.id,
      )
      setSuccess('Ayurvedic Assessment & Panchakarma Plan successfully recorded and activated.')
      setForm(INITIAL_FORM)
      setSelectedPatientId('')
      setPatient(null)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) return <PageSpinner />

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Ayurvedic Assessment &amp; Panchakarma Consultation"
        subtitle="Comprehensive clinical examination, Ashtavidha Pariksha, and multi-stage Panchakarma protocol prescription"
      />

      {submitError && <Alert message={submitError} onClose={() => setSubmitError(null)} className="mb-4" />}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* 1. Patient Selection */}
        <Card>
          <CardHeader title="1. Patient Selection" subtitle="Choose patient for clinical consultation" />
          <FormField label="Select Patient" error={errors.patient} required>
            <Select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              error={errors.patient}
            >
              <option value="">— Choose a patient —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} · {p.phone} (Prakriti: {p.prakriti || 'N/A'})
                </option>
              ))}
            </Select>
          </FormField>

          {patient && (
            <div className="mt-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-sm text-stone-900">{patient.fullName}</span>
                  <span className="text-stone-500 ml-2">
                    {calculateAge(patient.dateOfBirth)} yrs · {patient.gender}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Prakriti: {patient.prakriti || 'Vata-Pitta'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-stone-600">
                <div><span className="text-stone-400">Agni: </span>{patient.agniType || 'Sama Agni'}</div>
                <div><span className="text-stone-400">Koshta: </span>{patient.koshtaType || 'Madhyama'}</div>
                {patient.allergies && (
                  <div className="col-span-2 text-amber-800 font-medium">
                    ⚠️ Allergies: {patient.allergies}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* 2. Ashtavidha Pariksha (Eight-Fold Clinical Examination) */}
        <Card>
          <CardHeader
            title="2. Ashtavidha Pariksha (Classical Ayurvedic Examination)"
            subtitle="Clinical pulse, tongue, elimination, and sensory assessment"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <FormField label="Nadi (Pulse)">
              <Input
                value={form.ashtavidhaNadi}
                onChange={(e) => set('ashtavidhaNadi', e.target.value)}
                placeholder="e.g. Sarpagati, Manduka, Hamsa"
              />
            </FormField>
            <FormField label="Jihva (Tongue)">
              <Input
                value={form.ashtavidhaJihva}
                onChange={(e) => set('ashtavidhaJihva', e.target.value)}
                placeholder="Niram, Saam (coated), dry, red"
              />
            </FormField>
            <FormField label="Mutra (Urine)">
              <Input
                value={form.ashtavidhaMutra}
                onChange={(e) => set('ashtavidhaMutra', e.target.value)}
                placeholder="Prakrita, Peeta, Avila"
              />
            </FormField>
            <FormField label="Mala (Feces / Bowel)">
              <Input
                value={form.ashtavidhaMala}
                onChange={(e) => set('ashtavidhaMala', e.target.value)}
                placeholder="Vibandha, Mridu, Baddha"
              />
            </FormField>
            <FormField label="Sparsha (Skin / Temperature)">
              <Input
                value={form.ashtavidhaSparsha}
                onChange={(e) => set('ashtavidhaSparsha', e.target.value)}
                placeholder="Sheeta (cold), Ushna, Ruksha"
              />
            </FormField>
            <FormField label="Shabda (Voice / Resonancy)">
              <Input
                value={form.ashtavidhaShabda}
                onChange={(e) => set('ashtavidhaShabda', e.target.value)}
                placeholder="Spashta, Guru, Ksheena"
              />
            </FormField>
            <FormField label="Druk (Eyes / Sclera)">
              <Input
                value={form.ashtavidhaDruk}
                onChange={(e) => set('ashtavidhaDruk', e.target.value)}
                placeholder="Prakrita, Rakta, Peeta"
              />
            </FormField>
            <FormField label="Aakruti (Body Build)">
              <Input
                value={form.ashtavidhaAakruti}
                onChange={(e) => set('ashtavidhaAakruti', e.target.value)}
                placeholder="Sthula, Krisha, Madhyama"
              />
            </FormField>
          </div>
        </Card>

        {/* 3. Symptoms, Diagnosis & Panchakarma Indication */}
        <Card>
          <CardHeader title="3. Clinical Diagnosis &amp; Panchakarma Indication" />
          <div className="space-y-4">
            <FormField label="Presenting Symptoms & Chief Complaints" error={errors.symptoms} required>
              <Textarea
                value={form.symptoms}
                onChange={(e) => set('symptoms', e.target.value)}
                placeholder="Document localized pains, stiffness duration, agni status, bowel irregularities, sleep quality…"
                error={errors.symptoms}
                rows={3}
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Ayurvedic Diagnosis / Dosha Imbalance" error={errors.diagnosis} required>
                <Input
                  value={form.diagnosis}
                  onChange={(e) => set('diagnosis', e.target.value)}
                  placeholder="e.g. Vata imbalance — Kati Shoola / Sandhivata"
                  error={errors.diagnosis}
                />
              </FormField>

              <FormField label="Initial Treatment Stage">
                <Select
                  value={form.treatmentStage}
                  onChange={(e) => set('treatmentStage', e.target.value)}
                >
                  <option value="Purva Karma">Purva Karma (Preparatory Snehana & Swedana)</option>
                  <option value="Pradhana Karma">Pradhana Karma (Primary Cleansing)</option>
                  <option value="Paschat Karma">Paschat Karma (Post-Cleanse Rejuvenation)</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Overall Panchakarma Protocol Outline" error={errors.treatmentPlan} required>
              <Textarea
                value={form.treatmentPlan}
                onChange={(e) => set('treatmentPlan', e.target.value)}
                placeholder="Outline sequential protocol: Days 1-7 Snehana & Swedana; Days 8-15 Basti/Nasya; Days 16-21 Paschat Karma…"
                error={errors.treatmentPlan}
                rows={2}
              />
            </FormField>
          </div>
        </Card>

        {/* 4. Therapy Prescription & Instructions */}
        <Card>
          <CardHeader
            title="4. Immediate Therapy Prescription &amp; Pathya-Apathya"
            subtitle="Configures scheduling sequence and instructions for therapists and patient"
          />
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <FormField label="Prescribed Procedure / Therapy" error={errors.therapyId} required>
                  <Select
                    value={form.therapyId}
                    onChange={(e) => set('therapyId', e.target.value)}
                    error={errors.therapyId}
                  >
                    <option value="">— Select Therapy —</option>
                    {therapies.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.defaultDurationMins} min) — {t.category} ({t.stage})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <FormField label="Session Duration (min)" error={errors.therapyDurationMins} required>
                <Input
                  type="number"
                  value={form.therapyDurationMins}
                  onChange={(e) => set('therapyDurationMins', e.target.value)}
                  min={15}
                  max={180}
                  error={errors.therapyDurationMins}
                />
              </FormField>

              <FormField label="Total Number of Sessions" error={errors.numberOfSessions} required>
                <Input
                  type="number"
                  value={form.numberOfSessions}
                  onChange={(e) => set('numberOfSessions', e.target.value)}
                  min={1}
                  max={90}
                  error={errors.numberOfSessions}
                />
              </FormField>

              <FormField label="Follow-up Review Date">
                <Input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => set('followUpDate', e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Doctor Instructions for Therapists">
                <Textarea
                  value={form.doctorNotes}
                  onChange={(e) => set('doctorNotes', e.target.value)}
                  placeholder="Specific medicated oils, dough ring placement, pressure, monitoring vitals..."
                  rows={2}
                />
              </FormField>
              <FormField label="Pathya-Apathya (Diet & Lifestyle Instructions)">
                <Textarea
                  value={form.dietaryInstructions}
                  onChange={(e) => set('dietaryInstructions', e.target.value)}
                  placeholder="Warm gruel (Peya/Yusha), avoid air conditioning, daytime sleep, and heavy food..."
                  rows={2}
                />
              </FormField>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Save Assessment &amp; Generate Treatment Plan
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/patients')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
