function specList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

export default function TherapistInfoPanel({ therapist }) {
  if (!therapist) return null

  const specs = specList(therapist.specializations)
  const languages = specList(therapist.languages)
  const experience = therapist.experience ?? therapist.experienceYears
  const status = therapist.availabilityStatus || therapist.status || 'Available'

  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-stone-800">
      <p className="font-semibold text-stone-900">{therapist.name}</p>
      <p className="mt-1 text-xs text-stone-500">
        {status}
        {therapist.gender ? ` · ${therapist.gender}` : ''}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {specs.length ? specs.map((spec) => (
          <span key={spec} className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
            {spec}
          </span>
        )) : (
          <span className="text-xs text-stone-500">Specialization not listed yet</span>
        )}
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {therapist.qualification && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Qualification</dt>
            <dd>{therapist.qualification}</dd>
          </div>
        )}
        {experience ? (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Experience</dt>
            <dd>{experience} years</dd>
          </div>
        ) : null}
        {languages.length > 0 && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Languages</dt>
            <dd>{languages.join(', ')}</dd>
          </div>
        )}
      </dl>
      {therapist.aboutMe && (
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{therapist.aboutMe}</p>
      )}
    </div>
  )
}
