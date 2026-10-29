import { Stethoscope } from 'lucide-react'
import FormField, { Select, Textarea } from '../FormField.jsx'
import { LANGUAGE_OPTIONS, SPECIALIZATION_OPTIONS } from '../../utils/therapistProfile.js'
import SectionCard from './SectionCard.jsx'

export default function ProfessionalInformationSection({ form, patch, toggleLanguage }) {
  return (
    <SectionCard
      step="2"
      icon={Stethoscope}
      title="Professional Information"
      subtitle="Used by the AI scheduler to match you with the right patients"
    >
      <div className="grid grid-cols-1 gap-4">
        <FormField label="Specialization" hint="Primary clinical focus for recommendations">
          <Select value={form.specialization} onChange={(e) => patch('specialization', e.target.value)}>
            <option value="">Select specialization</option>
            {SPECIALIZATION_OPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Languages Known" hint="Select all languages you can consult in">
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((language) => {
              const selected = form.languages.includes(language)
              return (
                <button
                  key={language}
                  type="button"
                  onClick={() => toggleLanguage(language)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? 'border-green-300 bg-green-50 text-green-800'
                      : 'border-warm-200 bg-white text-warm-600 hover:border-green-200 hover:bg-green-50'
                  }`}
                >
                  {language}
                </button>
              )
            })}
          </div>
        </FormField>

        <FormField label="About Me">
          <Textarea
            rows={5}
            value={form.aboutMe}
            onChange={(e) => patch('aboutMe', e.target.value)}
            placeholder="Describe your experience, specialties, and approach towards Panchakarma therapies."
          />
        </FormField>
      </div>
    </SectionCard>
  )
}
