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
  medicalHistory: '',
  emergencyContact: '',
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
    <div className="max-w-2xl">
      <PageHeader
        title="Register Patient"
        back={{ label: 'Patients', onClick: () => navigate('/patients') }}
      />

      {submitError && <Alert message={submitError} onClose={() => setSubmitError(null)} className="mb-4" />}

      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            <FormField label="Emergency Contact" error={errors.emergencyContact} required hint="Name and phone number">
              <Input
                value={form.emergencyContact}
                onChange={(e) => set('emergencyContact', e.target.value)}
                placeholder="Name — 98XXXXXXXX"
                error={errors.emergencyContact}
              />
            </FormField>
          </div>

          <FormField label="Address" error={errors.address} required>
            <Textarea
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Street, City, PIN"
              error={errors.address}
              rows={2}
            />
          </FormField>

          <FormField label="Medical History" hint="Existing conditions, allergies, medications">
            <Textarea
              value={form.medicalHistory}
              onChange={(e) => set('medicalHistory', e.target.value)}
              placeholder="Relevant medical background…"
              rows={3}
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Register Patient</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/patients')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
