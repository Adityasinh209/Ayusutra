import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { createPatient } from '../../services/patients.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card from '../../components/Card.jsx'
import FormField, { Input, Textarea, Select } from '../../components/FormField.jsx'
import Button from '../../components/Button.jsx'
import Alert from '../../components/Alert.jsx'
import { required, validPhone, validEmail, validate } from '../../utils/validation.js'

const INITIAL = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  emergencyContact: '',
  prakriti: 'Vata-Pitta',
  vikriti: '',
  agniType: 'Vishama Agni (Irregular)',
  koshtaType: 'Madhyama (Moderate)',
  chiefComplaint: '',
  medicalHistory: '',
  allergies: '',
}

export default function NewPatientPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [loading, setLoading] = useState(false)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { errors: errs, hasError } = validate({
      fullName: required(form.fullName, 'Full name'),
      dateOfBirth: required(form.dateOfBirth, 'Date of birth'),
      gender: required(form.gender, 'Gender'),
      phone: required(form.phone, 'Phone') ?? validPhone(form.phone),
      email: validEmail(form.email),
      address: required(form.address, 'Address'),
      emergencyContact: required(form.emergencyContact, 'Emergency contact'),
    })
    if (hasError) { setErrors(errs); return }

    setLoading(true)
    setSubmitError(null)
    try {
      const patient = await createPatient(form, user.id)
      navigate(`/patients/${patient.id}`)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Register Panchakarma Patient"
        subtitle="Record patient demographics and baseline Ayurvedic constitution profile"
        back={{ label: 'Patients Directory', onClick: () => navigate('/patients') }}
      />

      {submitError && <Alert message={submitError} onClose={() => setSubmitError(null)} className="mb-4" />}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Demographics */}
        <Card>
          <h3 className="text-sm font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100">
            1. Personal Demographics &amp; Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" error={errors.fullName} required>
              <Input
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                placeholder="e.g. Rahul Sharma"
                error={errors.fullName}
              />
            </FormField>
            <FormField label="Date of Birth" error={errors.dateOfBirth} required>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set('dateOfBirth', e.target.value)}
                error={errors.dateOfBirth}
              />
            </FormField>
            <FormField label="Gender" error={errors.gender} required>
              <Select value={form.gender} onChange={(e) => set('gender', e.target.value)} error={errors.gender}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </Select>
            </FormField>
            <FormField label="Phone Number" error={errors.phone} required>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="10-digit mobile number"
                error={errors.phone}
                maxLength={10}
              />
            </FormField>
            <FormField label="Email Address" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="patient@email.com"
                error={errors.email}
              />
            </FormField>
            <FormField label="Emergency Contact" error={errors.emergencyContact} required hint="Name & phone number">
              <Input
                value={form.emergencyContact}
                onChange={(e) => set('emergencyContact', e.target.value)}
                placeholder="Name — 98XXXXXXXX"
                error={errors.emergencyContact}
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Residential Address" error={errors.address} required>
                <Input
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Street, locality, city, pin code"
                  error={errors.address}
                />
              </FormField>
            </div>
          </div>
        </Card>

        {/* Ayurvedic Constitutional Assessment */}
        <Card>
          <h3 className="text-sm font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100">
            2. Ayurvedic Baseline Profile (Prakriti &amp; Physiology)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Prakriti (Constitutional Dominance)">
              <Select value={form.prakriti} onChange={(e) => set('prakriti', e.target.value)}>
                <option value="Vata">Vata (Ether & Air)</option>
                <option value="Pitta">Pitta (Fire & Water)</option>
                <option value="Kapha">Kapha (Water & Earth)</option>
                <option value="Vata-Pitta">Vata-Pitta</option>
                <option value="Pitta-Vata">Pitta-Vata</option>
                <option value="Pitta-Kapha">Pitta-Kapha</option>
                <option value="Kapha-Pitta">Kapha-Pitta</option>
                <option value="Kapha-Vata">Kapha-Vata</option>
                <option value="Vata-Kapha">Vata-Kapha</option>
                <option value="Tridoshic (Sama)">Tridoshic (Balanced)</option>
              </Select>
            </FormField>
            <FormField label="Agni (Digestive Capacity)">
              <Select value={form.agniType} onChange={(e) => set('agniType', e.target.value)}>
                <option value="Sama Agni (Balanced)">Sama Agni (Balanced metabolism)</option>
                <option value="Vishama Agni (Irregular)">Vishama Agni (Vata - erratic/bloating)</option>
                <option value="Tikshna Agni (Hyperactive)">Tikshna Agni (Pitta - intense/hyperacidity)</option>
                <option value="Manda Agni (Sluggish)">Manda Agni (Kapha - heavy/slow)</option>
              </Select>
            </FormField>
            <FormField label="Koshta (Bowel Tendency)">
              <Select value={form.koshtaType} onChange={(e) => set('koshtaType', e.target.value)}>
                <option value="Krura (Hard/Dry Bowel)">Krura (Constipated / requires strong purgation)</option>
                <option value="Madhyama (Moderate)">Madhyama (Normal daily evacuation)</option>
                <option value="Mridu (Soft/Sensitive Bowel)">Mridu (Sensitive / mild laxative response)</option>
              </Select>
            </FormField>
            <FormField label="Known Allergies / Sensitivities">
              <Input
                value={form.allergies}
                onChange={(e) => set('allergies', e.target.value)}
                placeholder="e.g. Sesame oil allergy, dust, pollen"
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Chief Health Complaint" hint="Primary reason seeking Panchakarma care">
                <Textarea
                  value={form.chiefComplaint}
                  onChange={(e) => set('chiefComplaint', e.target.value)}
                  placeholder="Describe primary symptoms, duration, aggravators..."
                  rows={2}
                />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField label="Past Medical History" hint="Surgeries, chronic conditions, medications">
                <Textarea
                  value={form.medicalHistory}
                  onChange={(e) => set('medicalHistory', e.target.value)}
                  placeholder="Hypertension, diabetes, past fractures..."
                  rows={2}
                />
              </FormField>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Save &amp; Open Profile
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/patients')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
