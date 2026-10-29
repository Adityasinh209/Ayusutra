import { useState } from 'react'
import PageHeader from '../../components/PageHeader.jsx'
import Card from '../../components/Card.jsx'
import FormField, { Input, Select } from '../../components/FormField.jsx'
import Button from '../../components/Button.jsx'
import Alert from '../../components/Alert.jsx'
import OtpVerification from '../../components/otp/OtpVerification.jsx'
import { registerStaff } from '../../services/staff.js'
import { required, validEmail, validPhone, validate } from '../../utils/validation.js'

const INITIAL = {
  role: 'therapist',
  fullName: '',
  email: '',
  mobile: '',
  gender: '',
  qualification: '',
  yearsOfExperience: '',
  shift: 'Morning',
  address: '',
}

export default function StaffRegistrationPage() {
  const [form, setForm] = useState(INITIAL)
  const [otpToken, setOtpToken] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'mobile' || field === 'role') setOtpToken('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { errors: next, hasError } = validate({
      fullName: required(form.fullName, 'Full name'),
      email: required(form.email, 'Email') ?? validEmail(form.email),
      mobile: required(form.mobile, 'Mobile number') ?? validPhone(form.mobile),
      otp: otpToken ? null : 'Verify the mobile number before creating the account.',
    })
    if (hasError) {
      setErrors(next)
      return
    }
    setLoading(true)
    setError('')
    try {
      const account = await registerStaff(form.role, {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        otpVerificationToken: otpToken,
      })
      setSuccess(`${account.name} is registered as ${form.role}.`)
      setForm(INITIAL)
      setOtpToken('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Register clinic staff"
        subtitle="Administrators create therapist and receptionist accounts after the mobile number is verified."
      />
      {error && <Alert message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Role" required>
              <Select value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="therapist">Therapist</option>
                <option value="receptionist">Receptionist</option>
              </Select>
            </FormField>
            <FormField label="Full Name" error={errors.fullName} required>
              <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} error={errors.fullName} />
            </FormField>
            <FormField label="Email" error={errors.email} required>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
            </FormField>
            <FormField label="Mobile Number" error={errors.mobile} required>
              <Input type="tel" maxLength={10} value={form.mobile} disabled={Boolean(otpToken)} onChange={(e) => set('mobile', e.target.value)} error={errors.mobile} />
            </FormField>
            <FormField label="Gender">
              <Select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </Select>
            </FormField>
            <FormField label="Qualification">
              <Input value={form.qualification} onChange={(e) => set('qualification', e.target.value)} />
            </FormField>
            <FormField label="Years of Experience">
              <Input type="number" min="0" value={form.yearsOfExperience} onChange={(e) => set('yearsOfExperience', e.target.value)} />
            </FormField>
            <FormField label="Shift">
              <Select value={form.shift} onChange={(e) => set('shift', e.target.value)}>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
              </Select>
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Address">
                <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
              </FormField>
            </div>
          </div>
        </Card>
        <OtpVerification
          mobile={form.mobile}
          purpose={`${form.role}_register`}
          verifiedToken={otpToken}
          onVerified={setOtpToken}
          onChangeNumber={() => setOtpToken('')}
        />
        {errors.otp && <p className="text-xs text-red-600">{errors.otp}</p>}
        <Button type="submit" loading={loading} disabled={!otpToken}>Create staff account</Button>
      </form>
    </div>
  )
}
