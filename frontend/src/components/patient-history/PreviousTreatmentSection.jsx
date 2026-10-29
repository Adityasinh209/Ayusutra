import { useEffect, useState } from 'react'
import Card from '../Card.jsx'
import FormField, { Input, Textarea } from '../FormField.jsx'
import Button from '../Button.jsx'
import { createPreviousTreatment, listPreviousTreatments, uploadPreviousReport } from '../../services/previousTreatments.js'

const EMPTY = {
  hospitalName: '', therapistName: '', treatmentName: '', diagnosis: '',
  startDate: '', endDate: '', medicines: '', notes: '',
}

export default function PreviousTreatmentSection({ patientId, draftRecords = [], onDraftChange }) {
  const [records, setRecords] = useState(draftRecords)
  const [form, setForm] = useState(EMPTY)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!patientId) return
    listPreviousTreatments(patientId).then(setRecords).catch((err) => setError(err.message))
  }, [patientId])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function addRecord(e) {
    e.preventDefault()
    if (!form.hospitalName.trim() || !form.treatmentName.trim()) {
      setError('Hospital / clinic name and treatment name are required.')
      return
    }
    setError('')
    if (!patientId) {
      const local = { ...form, id: `draft-${Date.now()}`, reports: files.map((file) => ({ fileName: file.name, file })), createdAt: new Date().toISOString() }
      const next = [local, ...records]
      setRecords(next)
      onDraftChange?.(next)
      setForm(EMPTY)
      setFiles([])
      return
    }
    const created = await createPreviousTreatment(patientId, form)
    let saved = created
    for (const file of files) {
      saved = await uploadPreviousReport(patientId, created.id, file)
    }
    setRecords((prev) => [saved, ...prev.filter((row) => row.id !== saved.id)])
    setForm(EMPTY)
    setFiles([])
  }

  return (
    <Card>
      <h3 className="mb-1 text-sm font-bold text-warm-900">Previous Treatment History</h3>
      <p className="mb-4 text-xs text-warm-500">Add earlier hospital or clinic courses. Reports can be PDF or image files.</p>
      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
      <div className="mb-4 space-y-3">
        {records.length === 0 && <p className="text-sm text-warm-500">No previous treatments recorded.</p>}
        {records.map((record) => (
          <article key={record.id} className="rounded-xl border border-warm-200 bg-warm-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-warm-900">{record.treatmentName}</h4>
                <p className="text-xs text-warm-500">{record.hospitalName} · {record.therapistName || 'Therapist not listed'}</p>
              </div>
              <span className="text-[11px] font-semibold text-green-700">{record.startDate || '—'} to {record.endDate || '—'}</span>
            </div>
            {record.diagnosis && <p className="mt-2 text-xs text-warm-700">Diagnosis: {record.diagnosis}</p>}
            {record.medicines && <p className="text-xs text-warm-700">Medicines: {record.medicines}</p>}
            {record.notes && <p className="text-xs text-warm-600">{record.notes}</p>}
            {(record.reports || []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {record.reports.map((report) => (
                  report.reportUrl
                    ? <a key={report.id || report.fileName} href={report.reportUrl} className="text-xs font-semibold text-green-700 underline" target="_blank" rel="noreferrer">{report.fileName}</a>
                    : <span key={report.fileName} className="text-xs text-warm-600">{report.fileName}</span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Hospital / Clinic Name"><Input value={form.hospitalName} onChange={(e) => set('hospitalName', e.target.value)} /></FormField>
        <FormField label="Therapist Name"><Input value={form.therapistName} onChange={(e) => set('therapistName', e.target.value)} /></FormField>
        <FormField label="Treatment Name"><Input value={form.treatmentName} onChange={(e) => set('treatmentName', e.target.value)} /></FormField>
        <FormField label="Diagnosis"><Input value={form.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} /></FormField>
        <FormField label="Treatment Start Date"><Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></FormField>
        <FormField label="Treatment End Date"><Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} /></FormField>
        <FormField label="Medicines Taken" className="sm:col-span-2"><Textarea rows={2} value={form.medicines} onChange={(e) => set('medicines', e.target.value)} /></FormField>
        <FormField label="Notes" className="sm:col-span-2"><Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></FormField>
        <FormField label="Upload Reports (PDF/Image)" className="sm:col-span-2">
          <Input type="file" accept="application/pdf,image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        </FormField>
      </div>
      <Button type="button" className="mt-3" onClick={addRecord}>Add treatment record</Button>
    </Card>
  )
}
