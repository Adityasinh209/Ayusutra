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
import { formatDate, calculateAge } from '../../utils/date.js'

const INITIAL_FORM = {
  symptoms: '',
  diagnosis: '',
  treatmentPlan: '',
  therapyId: '',
  therapyDurationMins: '',
  numberOfSessions: '',
  doctorNotes: '',
  followUpDate: '',
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
      .then(([p, t]) => { setPatients(p); setTherapies(t) })
      .finally(() => setInitLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedPatientId) { setPatient(null); return }
    getPatient(selectedPatientId).then(setPatient).catch(() => setPatient(null))
  }, [selectedPatientId])

  useEffect(() => {
    const therapy = therapies.find((t) => t.id === form.therapyId)
    if (therapy) {
      setForm((prev) => ({ ...prev, therapyDurationMins: String(therapy.defaultDurationMins) }))
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
      symptoms: required(form.symptoms, 'Symptoms'),
      diagnosis: required(form.diagnosis, 'Diagnosis'),
      treatmentPlan: required(form.treatmentPlan, 'Treatment plan'),
      therapyId: required(form.therapyId, 'Therapy'),
      therapyDurationMins: required(form.therapyDurationMins, 'Duration'),
      numberOfSessions: required(form.numberOfSessions, 'Number of sessions'),
    })
    if (hasError) { setErrors(errs); return }

    setLoading(true)
    setSubmitError(null)
    try {
      await createEmr(
        {
          patientId: selectedPatientId,
          ...form,
          therapyDurationMins: Number(form.therapyDurationMins),
          numberOfSessions: Number(form.numberOfSessions),
        },
        user.id,
      )
      setSuccess('Consultation record saved successfully.')
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
    <div className="max-w-3xl">
      <PageHeader title="Doctor Consultation" subtitle="Create an EMR record for the selected patient" />

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
        {/* Patient selection */}
        <Card>
          <CardHeader title="Patient" />
          <FormField label="Select Patient" error={errors.patient} required>
            <Select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              error={errors.patient}
            >
              <option value="">— Choose a patient —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName} · {p.phone}</option>
              ))}
            </Select>
          </FormField>

          {patient && (
            <div className="mt-4 p-3 rounded-md bg-gray-50 border border-gray-100 text-sm space-y-1">
              <p className="font-medium text-gray-800">{patient.fullName}</p>
              <p className="text-gray-500">{calculateAge(patient.dateOfBirth)} yrs · {patient.gender}</p>
              {patient.medicalHistory && (
                <p className="text-gray-600 pt-1"><span className="text-gray-400 mr-1">History:</span>{patient.medicalHistory}</p>
              )}
            </div>
          )}
        </Card>

        {/* Clinical details */}
        <Card>
          <CardHeader title="Clinical Details" />
          <div className="space-y-4">
            <FormField label="Presenting Symptoms" error={errors.symptoms} required>
              <Textarea
                value={form.symptoms}
                onChange={(e) => set('symptoms', e.target.value)}
                placeholder="Describe the patient's symptoms…"
                error={errors.symptoms}
                rows={3}
              />
            </FormField>
            <FormField label="Diagnosis" error={errors.diagnosis} required>
              <Input
                value={form.diagnosis}
                onChange={(e) => set('diagnosis', e.target.value)}
                placeholder="e.g. Vata imbalance — Kati Shoola"
                error={errors.diagnosis}
              />
            </FormField>
            <FormField label="Treatment Plan" error={errors.treatmentPlan} required>
              <Textarea
                value={form.treatmentPlan}
                onChange={(e) => set('treatmentPlan', e.target.value)}
                placeholder="Outline the treatment approach…"
                error={errors.treatmentPlan}
                rows={2}
              />
            </FormField>
            <FormField label="Doctor Notes">
              <Textarea
                value={form.doctorNotes}
                onChange={(e) => set('doctorNotes', e.target.value)}
                placeholder="Any additional notes for the care team…"
                rows={2}
              />
            </FormField>
            <FormField label="Follow-up Date">
              <Input
                type="date"
                value={form.followUpDate}
                onChange={(e) => set('followUpDate', e.target.value)}
              />
            </FormField>
          </div>
        </Card>

        {/* Therapy prescription */}
        <Card>
          <CardHeader title="Therapy Prescription" />
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <FormField label="Prescribed Therapy" error={errors.therapyId} required>
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
            </div>
            <FormField label="Duration (minutes)" error={errors.therapyDurationMins} required>
              <Input
                type="number"
                value={form.therapyDurationMins}
                onChange={(e) => set('therapyDurationMins', e.target.value)}
                min={15}
                max={180}
                error={errors.therapyDurationMins}
              />
            </FormField>
            <FormField label="Number of Sessions" error={errors.numberOfSessions} required>
              <Input
                type="number"
                value={form.numberOfSessions}
                onChange={(e) => set('numberOfSessions', e.target.value)}
                min={1}
                max={90}
                error={errors.numberOfSessions}
              />
            </FormField>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Save Consultation</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/patients')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
