import { Camera } from 'lucide-react'
import FormField, { Input, Select } from '../FormField.jsx'
import SectionCard from './SectionCard.jsx'
import { UserRound } from 'lucide-react'

export default function PersonalInformationSection({ form, errors, patch, setPhoto }) {
  return (
    <SectionCard
      step="1"
      icon={UserRound}
      title="Personal Information"
      subtitle="Identity, credentials, and contact details used across the clinic roster"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[180px_1fr]">
        <FormField label="Profile Photo">
          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-warm-300 bg-warm-50 px-4 py-6 text-center transition hover:border-green-400 hover:bg-green-50">
            {form.photoDataUrl ? (
              <img
                src={form.photoDataUrl}
                alt="Therapist profile preview"
                className="mb-3 h-24 w-24 rounded-full object-cover ring-2 ring-green-200"
              />
            ) : (
              <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-700 shadow-sm ring-1 ring-green-100">
                <Camera className="h-6 w-6" />
              </span>
            )}
            <span className="text-xs font-semibold text-green-800">Upload photo</span>
            <span className="mt-1 text-[10.5px] text-warm-400">JPG or PNG, up to 2 MB</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
          </label>
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full Name" required error={errors.fullName}>
            <Input
              value={form.fullName}
              onChange={(e) => patch('fullName', e.target.value)}
              placeholder="e.g. Amit Joshi"
              error={errors.fullName}
            />
          </FormField>
          <FormField label="Gender">
            <Select value={form.gender} onChange={(e) => patch('gender', e.target.value)}>
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </Select>
          </FormField>
          <FormField label="Mobile Number" error={errors.mobile}>
            <Input
              type="tel"
              maxLength={10}
              value={form.mobile}
              onChange={(e) => patch('mobile', e.target.value)}
              placeholder="10-digit mobile number"
              error={errors.mobile}
            />
          </FormField>
          <FormField label="Email Address" error={errors.email} hint="Read-only when provided by your account">
            <Input
              type="email"
              value={form.email}
              readOnly={Boolean(form.email)}
              onChange={(e) => patch('email', e.target.value)}
              placeholder="therapist@ayursutra.dev"
              error={errors.email}
            />
          </FormField>
          <FormField label="Qualification" required error={errors.qualification}>
            <Input
              value={form.qualification}
              onChange={(e) => patch('qualification', e.target.value)}
              placeholder="e.g. BAMS, MD (Panchakarma)"
              error={errors.qualification}
            />
          </FormField>
          <FormField label="Registration Number">
            <Input
              value={form.registrationNumber}
              onChange={(e) => patch('registrationNumber', e.target.value)}
              placeholder="Council / clinic registration ID"
            />
          </FormField>
          <FormField label="Years of Experience" required error={errors.yearsOfExperience} className="sm:col-span-2">
            <Input
              type="number"
              min="0"
              max="60"
              value={form.yearsOfExperience}
              onChange={(e) => patch('yearsOfExperience', e.target.value)}
              placeholder="e.g. 8"
              error={errors.yearsOfExperience}
            />
          </FormField>
        </div>
      </div>
    </SectionCard>
  )
}
