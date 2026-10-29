import { Activity, Gauge, HeartHandshake } from 'lucide-react'
import FormField, { Input, Select } from '../FormField.jsx'
import { STATUS_OPTIONS } from '../../utils/therapistProfile.js'
import SectionCard from './SectionCard.jsx'

const STATUS_BADGE = {
  Available: 'bg-green-100 text-green-800 ring-green-200',
  Busy: 'bg-orange-100 text-orange-800 ring-orange-200',
  'On Leave': 'bg-red-100 text-red-800 ring-red-200',
}

const PREFERENCES = [
  { key: 'acceptMalePatients', label: 'Accept Male Patients' },
  { key: 'acceptFemalePatients', label: 'Accept Female Patients' },
  { key: 'acceptChildren', label: 'Accept Children' },
  { key: 'acceptSeniorCitizens', label: 'Accept Senior Citizens' },
]

export default function CapacityStatusPreferences({ form, patch }) {
  return (
    <>
      <SectionCard
        step="5"
        icon={Gauge}
        title="Daily Capacity"
        subtitle="Caps used by the scheduler so your day is never overbooked"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Maximum Patients Per Day">
            <Input
              type="number"
              min="1"
              max="50"
              value={form.maxPatientsPerDay}
              onChange={(e) => patch('maxPatientsPerDay', e.target.value)}
            />
          </FormField>
          <FormField label="Maximum Sessions Per Day">
            <Input
              type="number"
              min="1"
              max="50"
              value={form.maxSessionsPerDay}
              onChange={(e) => patch('maxSessionsPerDay', e.target.value)}
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        step="6"
        icon={Activity}
        title="Current Status"
        subtitle="Live roster status shown to reception and the scheduling engine"
        action={
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-medium ring-1 ring-inset ${STATUS_BADGE[form.status]}`}>
            {form.status}
          </span>
        }
      >
        <FormField label="Status">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={form.status} onChange={(e) => patch('status', e.target.value)} className="sm:max-w-xs">
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.value}</option>
              ))}
            </Select>
            <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE[form.status]}`}>
              {form.status}
            </span>
          </div>
        </FormField>
      </SectionCard>

      <SectionCard
        step="7"
        icon={HeartHandshake}
        title="Preferences"
        subtitle="Patient groups you are willing to treat"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PREFERENCES.map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-warm-200 bg-warm-50/60 px-4 py-3 text-sm font-medium text-warm-800 hover:border-green-200 hover:bg-green-50/50"
            >
              <input
                type="checkbox"
                checked={form[item.key]}
                onChange={(e) => patch(item.key, e.target.checked)}
                className="h-4 w-4 rounded border-warm-300 text-green-700 focus:ring-green-500"
              />
              {item.label}
            </label>
          ))}
        </div>
      </SectionCard>
    </>
  )
}
