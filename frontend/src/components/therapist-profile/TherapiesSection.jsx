import { Check, Droplets } from 'lucide-react'
import { THERAPY_CATALOG } from '../../utils/therapistProfile.js'
import SectionCard from './SectionCard.jsx'
import FormField, { Input } from '../FormField.jsx'

export default function TherapiesSection({ form, errors, toggleTherapy, setTherapyDuration }) {
  return (
    <SectionCard
      step="3"
      icon={Droplets}
      title="Therapies You Perform"
      subtitle="Tick each protocol you are certified to deliver. Duration feeds slot length in scheduling."
    >
      {errors.therapies && <p className="mb-3 text-xs text-red-600">{errors.therapies}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {THERAPY_CATALOG.map((therapy) => {
          const selected = Boolean(form.selectedTherapies[therapy.id])
          return (
            <div
              key={therapy.id}
              className={`rounded-2xl border p-4 transition ${
                selected
                  ? 'border-green-300 bg-green-50/70 shadow-sm'
                  : 'border-warm-200 bg-white hover:border-green-200'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleTherapy(therapy)}
                className="flex w-full items-start gap-3 text-left"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    selected ? 'border-green-600 bg-green-600 text-white' : 'border-warm-300 bg-white'
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span>
                  <span className="block text-sm font-bold text-warm-900">{therapy.name}</span>
                  <span className="text-[11px] text-warm-500">Default {therapy.defaultDuration} min</span>
                </span>
              </button>
              {selected && (
                <div className="mt-3 pl-8">
                  <FormField label="Duration (minutes)">
                    <Input
                      type="number"
                      min="10"
                      max="240"
                      value={form.selectedTherapies[therapy.id].duration}
                      onChange={(e) => setTherapyDuration(therapy.id, e.target.value)}
                    />
                  </FormField>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
