import { useCallback, useMemo, useState } from 'react'
import { required, validEmail, validPhone, validate } from '../utils/validation.js'
import {
  THERAPY_CATALOG,
  buildTherapistProfilePayload,
  createInitialTherapistProfile,
} from '../utils/therapistProfile.js'

function timeToMinutes(value) {
  if (!value) return null
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function useTherapistProfileForm(user) {
  const [form, setForm] = useState(() => createInitialTherapistProfile(user))
  const [errors, setErrors] = useState({})
  const [savedPayload, setSavedPayload] = useState(null)

  const patch = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev))
  }, [])

  const toggleLanguage = useCallback((language) => {
    setForm((prev) => {
      const next = prev.languages.includes(language)
        ? prev.languages.filter((item) => item !== language)
        : [...prev.languages, language]
      return { ...prev, languages: next }
    })
  }, [])

  const toggleTherapy = useCallback((therapy) => {
    setForm((prev) => {
      const selected = { ...prev.selectedTherapies }
      if (selected[therapy.id]) {
        delete selected[therapy.id]
      } else {
        selected[therapy.id] = { duration: String(therapy.defaultDuration) }
      }
      return { ...prev, selectedTherapies: selected }
    })
    setErrors((prev) => (prev.therapies ? { ...prev, therapies: null } : prev))
  }, [])

  const setTherapyDuration = useCallback((therapyId, duration) => {
    setForm((prev) => ({
      ...prev,
      selectedTherapies: {
        ...prev.selectedTherapies,
        [therapyId]: { ...prev.selectedTherapies[therapyId], duration },
      },
    }))
  }, [])

  const setAvailability = useCallback((day, field, value) => {
    setForm((prev) => ({
      ...prev,
      availability: prev.availability.map((row) => (
        row.day === day ? { ...row, [field]: value } : row
      )),
    }))
    setErrors((prev) => {
      if (!prev.workingDays && !prev.workingHours) return prev
      return { ...prev, workingDays: null, workingHours: null }
    })
  }, [])

  const setPhoto = useCallback((file) => {
    if (!file) {
      patch('photoDataUrl', '')
      patch('photoName', '')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        photoDataUrl: String(reader.result || ''),
        photoName: file.name,
      }))
    }
    reader.readAsDataURL(file)
  }, [patch])

  const validateForm = useCallback(() => {
    const workingDays = form.availability.filter((row) => row.working)
    const invalidHours = workingDays.find((row) => {
      const start = timeToMinutes(row.startTime)
      const end = timeToMinutes(row.endTime)
      return start == null || end == null || start >= end
    })

    const { errors: next, hasError } = validate({
      fullName: required(form.fullName, 'Full name'),
      qualification: required(form.qualification, 'Qualification'),
      yearsOfExperience: required(form.yearsOfExperience, 'Experience'),
      email: validEmail(form.email),
      mobile: form.mobile ? validPhone(form.mobile) : null,
      therapies: Object.keys(form.selectedTherapies).length ? null : 'Select at least one therapy.',
      workingDays: workingDays.length ? null : 'Enable at least one working day.',
      workingHours: invalidHours
        ? `Set valid working hours for ${invalidHours.label} (start must be before end).`
        : null,
    })

    setErrors(next)
    return !hasError
  }, [form])

  const payload = useMemo(() => buildTherapistProfilePayload(form), [form])

  const save = useCallback(() => {
    if (!validateForm()) return null
    setSavedPayload(payload)
    return payload
  }, [payload, validateForm])

  const therapyCount = Object.keys(form.selectedTherapies).length
  const workingDayCount = form.availability.filter((row) => row.working).length
  const selectedTherapyNames = THERAPY_CATALOG
    .filter((therapy) => form.selectedTherapies[therapy.id])
    .map((therapy) => therapy.name)

  return {
    form,
    errors,
    payload,
    savedPayload,
    patch,
    toggleLanguage,
    toggleTherapy,
    setTherapyDuration,
    setAvailability,
    setPhoto,
    save,
    therapyCount,
    workingDayCount,
    selectedTherapyNames,
  }
}
