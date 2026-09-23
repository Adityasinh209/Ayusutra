import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { listPlans, updatePlanStage, createPlan } from '../../services/plans.js'
import { listPatients } from '../../services/patients.js'
import { listTherapies } from '../../services/therapies.js'
import { listTherapists } from '../../services/therapists.js'
import { listRooms } from '../../services/rooms.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card from '../../components/Card.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import Modal from '../../components/Modal.jsx'
import FormField, { Input, Select, Textarea } from '../../components/FormField.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import Alert from '../../components/Alert.jsx'
import { formatDate } from '../../utils/date.js'

const STAGES = ['Purva Karma', 'Pradhana Karma', 'Paschat Karma', 'Follow-up', 'Completed']

export default function PlansPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [patients, setPatients] = useState([])
  const [therapies, setTherapies] = useState([])
  const [therapists, setTherapists] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stageFilter, setStageFilter] = useState('all')

  // Create Plan Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState({
    patientId: '',
    procedureName: '',
    primaryPanchakarma: 'Basti',
    treatmentStage: 'Purva Karma',
    totalSessions: 7,
    assignedTherapistId: '',
    assignedRoomId: '',
    doctorInstructions: '',
    dietPlan: '',
    followUpDate: '',
  })

  async function loadData() {
    try {
      const [allPlans, allPatients, allTherapies, allTherapists, allRooms] = await Promise.all([
        listPlans(),
        listPatients(),
        listTherapies(),
        listTherapists(),
        listRooms(),
      ])
      setPlans(allPlans)
      setPatients(allPatients)
      setTherapies(allTherapies)
      setTherapists(allTherapists)
      setRooms(allRooms)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleAdvance(planId, currentStage) {
    const idx = STAGES.indexOf(currentStage)
    if (idx === -1 || idx >= STAGES.length - 1) return
    const nextStage = STAGES[idx + 1]
    try {
      await updatePlanStage(planId, nextStage)
      await loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleCreatePlan(e) {
    e.preventDefault()
    if (!newPlan.patientId || !newPlan.procedureName) return
    setCreating(true)
    try {
      await createPlan(
        {
          ...newPlan,
          totalSessions: Number(newPlan.totalSessions) || 7,
        },
        user.id,
      )
      setModalOpen(false)
      setNewPlan({
        patientId: '',
        procedureName: '',
        primaryPanchakarma: 'Basti',
        treatmentStage: 'Purva Karma',
        totalSessions: 7,
        assignedTherapistId: '',
        assignedRoomId: '',
        doctorInstructions: '',
        dietPlan: '',
        followUpDate: '',
      })
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))
  const therapistMap = Object.fromEntries(therapists.map((t) => [t.id, t]))
  const roomMap = Object.fromEntries(rooms.map((r) => [r.id, r]))

  const filtered = stageFilter === 'all'
    ? plans
    : plans.filter((p) => p.treatmentStage === stageFilter)

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panchakarma Treatment Plans"
        subtitle="Manage multi-stage therapeutic progressions across Purva, Pradhana, and Paschat Karma"
        action={
          (user.role === 'doctor' || user.role === 'admin') && (
            <Button onClick={() => setModalOpen(true)}>
              + Create Treatment Plan
            </Button>
          )
        }
      />

      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}

      {/* Stage Filter Pills */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-stone-500 font-semibold mr-1">Stage Filter:</span>
        {['all', ...STAGES].map((st) => (
          <button
            key={st}
            onClick={() => setStageFilter(st)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              stageFilter === st
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {st === 'all' ? 'All Plans' : st}
          </button>
        ))}
      </div>

      {/* Plans List */}
      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-stone-400 py-8 text-center">
            No treatment plans currently found in {stageFilter === 'all' ? 'the center' : stageFilter}.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((plan) => {
            const patient = patientMap[plan.patientId]
            const therapist = therapistMap[plan.assignedTherapistId]
            const room = roomMap[plan.assignedRoomId]
            const progress = Math.round(((plan.completedSessions || 0) / (plan.totalSessions || 1)) * 100)

            return (
              <Card key={plan.id} className="border-stone-200 hover:border-emerald-300 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => navigate(`/patients/${plan.patientId}`)}
                        className="text-base font-bold text-stone-900 hover:text-emerald-700 cursor-pointer"
                      >
                        {patient?.fullName || 'Patient'}
                      </button>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium">
                        {patient?.prakriti || 'Vata-Pitta'}
                      </span>
                      <Badge label={plan.status} />
                    </div>
                    <p className="text-sm font-semibold text-emerald-800">
                      {plan.procedureName || plan.primaryPanchakarma}
                    </p>
                    <p className="text-xs text-stone-500">
                      Assigned Vaidya: Dr. Meera Nair · Center Protocol #{plan.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start lg:self-center">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        plan.treatmentStage === 'Pradhana Karma'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : plan.treatmentStage === 'Paschat Karma'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : plan.treatmentStage === 'Completed'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}
                    >
                      {plan.treatmentStage}
                    </span>

                    {user.role === 'doctor' && plan.treatmentStage !== 'Completed' && (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => handleAdvance(plan.id, plan.treatmentStage)}
                      >
                        Advance Stage →
                      </Button>
                    )}

                    <Button
                      size="xs"
                      onClick={() => navigate('/scheduling', { state: { patientId: plan.patientId } })}
                    >
                      Schedule Session
                    </Button>
                  </div>
                </div>

                {/* Session Progress and Clinical Workflow Steps */}
                <div className="pt-3 space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-stone-600 mb-1">
                      <span className="font-medium">
                        Session Sequence Progress: {plan.completedSessions || 0} of {plan.totalSessions} Sessions
                      </span>
                      <span className="font-bold text-emerald-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stage Sequence Tracker */}
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {STAGES.map((st, i) => {
                      const curIdx = STAGES.indexOf(plan.treatmentStage)
                      const isCurrent = plan.treatmentStage === st
                      const isPast = curIdx > i

                      return (
                        <div
                          key={st}
                          className={`p-2 rounded-lg ${
                            isCurrent
                              ? 'bg-emerald-600 text-white font-bold'
                              : isPast
                              ? 'bg-emerald-50 text-emerald-800 font-semibold'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          <span className="text-[9.5px] block opacity-75">Stage {i + 1}</span>
                          <span className="text-xs truncate block">{st}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Instructions & Facility Assignment */}
                  <div className="grid sm:grid-cols-3 gap-3 pt-2 text-stone-600">
                    <div className="p-2.5 bg-stone-50 rounded-lg">
                      <span className="font-bold text-stone-800 block mb-1">Facility Assignment</span>
                      <span>Therapist: {therapist?.name || 'Vaidya Roster'}</span>
                      <span className="block mt-0.5">Room: {room?.name || 'Designated Shala'}</span>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-lg sm:col-span-2">
                      <span className="font-bold text-stone-800 block mb-1">Vaidya Instructions &amp; Diet</span>
                      <p className="line-clamp-2">{plan.doctorInstructions || 'Standard clinical continuum.'}</p>
                      {plan.dietPlan && (
                        <p className="mt-1 text-[10.5px] text-emerald-800 font-medium">Pathya: {plan.dietPlan}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Formulate Panchakarma Treatment Plan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} loading={creating}>
              Create &amp; Authorize Plan
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
          <FormField label="Patient" required>
            <Select
              value={newPlan.patientId}
              onChange={(e) => setNewPlan({ ...newPlan, patientId: e.target.value })}
            >
              <option value="">— Select Patient —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.prakriti || 'N/A'})
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Procedure Name" required>
              <Input
                value={newPlan.procedureName}
                onChange={(e) => setNewPlan({ ...newPlan, procedureName: e.target.value })}
                placeholder="e.g. Yoga Basti Protocol (14 Days)"
              />
            </FormField>
            <FormField label="Primary Panchakarma">
              <Select
                value={newPlan.primaryPanchakarma}
                onChange={(e) => setNewPlan({ ...newPlan, primaryPanchakarma: e.target.value })}
              >
                <option value="Basti">Basti (Medicated Enemas)</option>
                <option value="Nasya">Nasya (Nasal Instillation)</option>
                <option value="Virechana">Virechana (Therapeutic Purgation)</option>
                <option value="Vamana">Vamana (Therapeutic Emesis)</option>
                <option value="Raktamokshana">Raktamokshana (Bloodletting)</option>
                <option value="Supportive Course">Supportive Shirodhara / Kizhi Course</option>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Initial Stage">
              <Select
                value={newPlan.treatmentStage}
                onChange={(e) => setNewPlan({ ...newPlan, treatmentStage: e.target.value })}
              >
                <option value="Purva Karma">Purva Karma</option>
                <option value="Pradhana Karma">Pradhana Karma</option>
                <option value="Paschat Karma">Paschat Karma</option>
              </Select>
            </FormField>
            <FormField label="Total Sessions">
              <Input
                type="number"
                value={newPlan.totalSessions}
                onChange={(e) => setNewPlan({ ...newPlan, totalSessions: e.target.value })}
                min={1}
                max={90}
              />
            </FormField>
            <FormField label="Follow-up Date">
              <Input
                type="date"
                value={newPlan.followUpDate}
                onChange={(e) => setNewPlan({ ...newPlan, followUpDate: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Assigned Therapist">
              <Select
                value={newPlan.assignedTherapistId}
                onChange={(e) => setNewPlan({ ...newPlan, assignedTherapistId: e.target.value })}
              >
                <option value="">— Choose Therapist —</option>
                {therapists.map((th) => (
                  <option key={th.id} value={th.id}>
                    {th.name} ({th.specialization})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Designated Room">
              <Select
                value={newPlan.assignedRoomId}
                onChange={(e) => setNewPlan({ ...newPlan, assignedRoomId: e.target.value })}
              >
                <option value="">— Choose Room —</option>
                {rooms.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.name} ({rm.roomType})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Vaidya Clinical Instructions">
            <Textarea
              value={newPlan.doctorInstructions}
              onChange={(e) => setNewPlan({ ...newPlan, doctorInstructions: e.target.value })}
              placeholder="Dosage, temperature of oils, precautions..."
              rows={2}
            />
          </FormField>

          <FormField label="Pathya-Apathya (Diet & Lifestyle)">
            <Textarea
              value={newPlan.dietPlan}
              onChange={(e) => setNewPlan({ ...newPlan, dietPlan: e.target.value })}
              placeholder="Recommended diet, restricted activities..."
              rows={2}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  )
}
