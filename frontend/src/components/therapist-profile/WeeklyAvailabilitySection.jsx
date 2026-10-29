import { CalendarClock } from 'lucide-react'
import SectionCard from './SectionCard.jsx'
import TimePicker from './TimePicker.jsx'
import ToggleSwitch from './ToggleSwitch.jsx'

export default function WeeklyAvailabilitySection({ form, errors, setAvailability }) {
  return (
    <SectionCard
      step="4"
      icon={CalendarClock}
      title="Weekly Availability"
      subtitle="Working days and hours used to generate AI slot recommendations"
    >
      {(errors.workingDays || errors.workingHours) && (
        <p className="mb-3 text-xs text-red-600">{errors.workingDays || errors.workingHours}</p>
      )}
      <div className="overflow-x-auto rounded-xl border border-warm-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-green-50 text-[11px] font-semibold uppercase tracking-wide text-green-800">
            <tr>
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3">Working</th>
              <th className="px-4 py-3">Start Time</th>
              <th className="px-4 py-3">End Time</th>
              <th className="px-4 py-3">Break Start</th>
              <th className="px-4 py-3">Break End</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100 bg-white">
            {form.availability.map((row) => (
              <tr key={row.day} className={row.working ? '' : 'bg-warm-50/80'}>
                <td className="px-4 py-3 font-semibold text-warm-800">{row.label}</td>
                <td className="px-4 py-3">
                  <ToggleSwitch
                    checked={row.working}
                    label={`${row.label} working`}
                    onChange={(checked) => setAvailability(row.day, 'working', checked)}
                  />
                </td>
                <td className="px-4 py-3 min-w-[140px]">
                  <TimePicker
                    value={row.startTime}
                    disabled={!row.working}
                    error={Boolean(errors.workingHours) && row.working}
                    onChange={(value) => setAvailability(row.day, 'startTime', value)}
                  />
                </td>
                <td className="px-4 py-3 min-w-[140px]">
                  <TimePicker
                    value={row.endTime}
                    disabled={!row.working}
                    error={Boolean(errors.workingHours) && row.working}
                    onChange={(value) => setAvailability(row.day, 'endTime', value)}
                  />
                </td>
                <td className="px-4 py-3 min-w-[140px]">
                  <TimePicker
                    value={row.breakStart}
                    disabled={!row.working}
                    onChange={(value) => setAvailability(row.day, 'breakStart', value)}
                  />
                </td>
                <td className="px-4 py-3 min-w-[140px]">
                  <TimePicker
                    value={row.breakEnd}
                    disabled={!row.working}
                    onChange={(value) => setAvailability(row.day, 'breakEnd', value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
