import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { findPatientForUser, patientNeedsIntake, submitPatientIntake } from '../services/patients.js'
import { clearAuthIntent } from '../auth/postAuthRedirect.js'
import ClerkAuthLayout from '../layouts/ClerkAuthLayout.jsx'
import Card from '../components/Card.jsx'
import FormField, { Input, Textarea, Select } from '../components/FormField.jsx'
import Button from '../components/Button.jsx'
import Alert from '../components/Alert.jsx'
import { required, validPhone, validEmail, validate } from '../utils/validation.js'

function initialForm(user) {
  const existing = findPatientForUser(user)
  return {
    fullName: existing?.fullName || user?.name || '',
    phone: existing?.phone || '',
    address: existing?.address || '',
    dateOfBirth: existing?.dateOfBirth || '',
    gender: existing?.gender || '',
    email: existing?.email || user?.email || '',
    emergencyContact: existing?.emergencyContact || '',
    chiefComplaint: existing?.chiefComplaint || '',
    medicalHistory: existing?.medicalHistory || '',
    allergies: existing?.allergies || '',
  }
}

export default function PatientIntakePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => initialForm(user))
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!user) return null
  if (user.role !== 'patient') return <Navigate to="/dashboard" replace />
  if (!patientNeedsIntake(user) && !success) return <Navigate to="/dashboard" replace />

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { errors: errs, hasError } = validate({
      fullName: required(form.fullName, 'Full name'),
      phone: required(form.phone, 'Mobile number') ?? validPhone(form.phone),
      address: required(form.address, 'Address'),
      dateOfBirth: required(form.dateOfBirth, 'Date of birth'),
      gender: required(form.gender, 'Gender'),
      email: validEmail(form.email),
      emergencyContact: required(form.emergencyContact, 'Emergency contact'),
      chiefComplaint: required(form.chiefComplaint, 'Chief complaint'),
    })
    if (hasError) {
      setErrors(errs)
      return
    }

    setLoading(true)
    setSubmitError(null)
    try {
      const patient = await submitPatientIntake(form, user)
      updateUser({
        name: patient.fullName,
        email: patient.email || user.email,
        patientId: patient.id,
        role: 'patient',
        roleLabel: user.roleLabel || 'Patient',
      })
      clearAuthIntent()
      setSuccess(true)
      window.setTimeout(() => navigate('/dashboard', { replace: true }), 700)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClerkAuthLayout eyebrow="Patient intake" wide>
      <div className="w-full">
        <h1 className="text-2xl font-normal text-green-900 mb-1" style={{ fontFamily: "'EB Garamond', serif" }}>
          Book your consultation
        </h1>
        <p className="text-sm text-green-800/70 mb-5">
          Tell us how to reach you and why you are seeking Panchakarma care. This is saved to your patient record.
        </p>

        {submitError && <Alert message={submitError} onClose={() => setSubmitError(null)} className="mb-4" />}
        {success && (
          <Alert type="success" message="Details saved. Opening your dashboard…" className="mb-4" />
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Card>
            <h2 className="text-sm font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100">
              Contact details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" error={errors.fullName} required>
                <Input
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  error={errors.fullName}
                />
              </FormField>
              <FormField label="Mobile Number" error={errors.phone} required>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="10-digit mobile number"
                  error={errors.phone}
                  maxLength={10}
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Address" error={errors.address} required>
                  <Input
                    value={form.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="Street, locality, city, pin code"
                    error={errors.address}
                  />
                </FormField>
              </div>
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
          </Card>

          <Card>
            <h2 className="text-sm font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100">
              Consultation details
            </h2>
            <div className="space-y-4">
              <FormField label="Chief Health Complaint" error={errors.chiefComplaint} required hint="Primary reason for booking">
                <Textarea
                  value={form.chiefComplaint}
                  onChange={(e) => set('chiefComplaint', e.target.value)}
                  placeholder="Describe primary symptoms, duration, and what aggravates them"
                  rows={3}
                  error={errors.chiefComplaint}
                />
              </FormField>
              <FormField label="Past Medical History" hint="Surgeries, chronic conditions, current medications">
                <Textarea
                  value={form.medicalHistory}
                  onChange={(e) => set('medicalHistory', e.target.value)}
                  placeholder="Hypertension, diabetes, past fractures…"
                  rows={2}
                />
              </FormField>
              <FormField label="Known Allergies / Sensitivities">
                <Input
                  value={form.allergies}
                  onChange={(e) => set('allergies', e.target.value)}
                  placeholder="e.g. Sesame oil, dust, pollen"
                />
              </FormField>
            </div>
          </Card>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Save & continue to dashboard
          </Button>
        </form>
      </div>
    </ClerkAuthLayout>
  )
}
