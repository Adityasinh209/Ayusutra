import { getAll, addItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'
import { api, apiUpload, remoteReady } from './http.js'

function ensure() {
  if (localStorage.getItem('ayursutra:previous_treatments') === null) localStorage.setItem('ayursutra:previous_treatments', '[]')
}

export async function listPreviousTreatments(patientId) {
  if (remoteReady()) return api(`/api/patients/${patientId}/history`)
  ensure()
  return getAll('previous_treatments').filter((row) => row.patientId === patientId)
}

export async function createPreviousTreatment(patientId, data) {
  if (remoteReady()) return api(`/api/patients/${patientId}/history`, { method: 'POST', body: data })
  ensure()
  return addItem('previous_treatments', {
    id: generateId('history'),
    patientId,
    hospitalName: data.hospitalName,
    therapistName: data.therapistName,
    treatmentName: data.treatmentName,
    diagnosis: data.diagnosis,
    startDate: data.startDate,
    endDate: data.endDate,
    medicines: data.medicines,
    notes: data.notes,
    reports: data.reports || [],
    createdAt: new Date().toISOString(),
  })
}

export async function persistDraftHistory(patientId, drafts) {
  for (const draft of drafts) {
    const created = await createPreviousTreatment(patientId, draft)
    for (const report of draft.reports || []) {
      if (report.file) await uploadPreviousReport(patientId, created.id, report.file)
    }
  }
}

export async function uploadPreviousReport(patientId, historyId, file) {
  if (remoteReady()) {
    const body = new FormData()
    body.append('file', file)
    return apiUpload(`/api/patients/${patientId}/history/${historyId}/reports`, body)
  }
  const reader = new FileReader()
  const reportUrl = await new Promise((resolve) => {
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
  const rows = getAll('previous_treatments')
  const current = rows.find((row) => row.id === historyId)
  const reports = [...(current?.reports || []), { id: generateId('report'), fileName: file.name, reportUrl }]
  const next = rows.map((row) => (row.id === historyId ? { ...row, reports } : row))
  localStorage.setItem('ayursutra:previous_treatments', JSON.stringify(next))
  return next.find((row) => row.id === historyId)
}
