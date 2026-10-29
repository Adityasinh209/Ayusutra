import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useTherapistProfileForm } from '../../hooks/useTherapistProfileForm.js'
import PageHeader from '../../components/PageHeader.jsx'
import Button from '../../components/Button.jsx'
import Alert from '../../components/Alert.jsx'
import { saveTherapistProfile } from '../../services/therapists.js'
import PersonalInformationSection from '../../components/therapist-profile/PersonalInformationSection.jsx'
import ProfessionalInformationSection from '../../components/therapist-profile/ProfessionalInformationSection.jsx'
import TherapiesSection from '../../components/therapist-profile/TherapiesSection.jsx'
import WeeklyAvailabilitySection from '../../components/therapist-profile/WeeklyAvailabilitySection.jsx'
import CapacityStatusPreferences from '../../components/therapist-profile/CapacityStatusPreferences.jsx'

export default function TherapistProfileSetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const formApi = useTherapistProfileForm(user)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    const payload = formApi.save()
    if (!payload) {
      setSuccess(null)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveTherapistProfile(payload, user)
      setSuccess('Profile saved. Scheduling will use these therapies, hours, and capacity.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Therapist Profile Setup"
        subtitle="Complete your professional profile. This information will be used by the AI scheduling system to recommend you to patients based on your specialization, availability, and experience."
        back={{ label: 'Dashboard', onClick: () => navigate('/dashboard') }}
      />

      {error && <Alert message={error} onClose={() => setError(null)} />}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess(null)} />
      )}

      <form onSubmit={handleSave} noValidate className="space-y-6">
        <PersonalInformationSection
          form={formApi.form}
          errors={formApi.errors}
          patch={formApi.patch}
          setPhoto={formApi.setPhoto}
        />
        <ProfessionalInformationSection
          form={formApi.form}
          patch={formApi.patch}
          toggleLanguage={formApi.toggleLanguage}
        />
        <TherapiesSection
          form={formApi.form}
          errors={formApi.errors}
          toggleTherapy={formApi.toggleTherapy}
          setTherapyDuration={formApi.setTherapyDuration}
        />
        <WeeklyAvailabilitySection
          form={formApi.form}
          errors={formApi.errors}
          setAvailability={formApi.setAvailability}
        />
        <CapacityStatusPreferences form={formApi.form} patch={formApi.patch} />

        <div className="flex flex-col gap-3 rounded-2xl border border-warm-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-warm-500">
            {formApi.therapyCount} {formApi.therapyCount === 1 ? 'therapy' : 'therapies'} selected · {formApi.workingDayCount} {formApi.workingDayCount === 1 ? 'working day' : 'working days'}
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <Save className="h-4 w-4" />
              Save Profile
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
