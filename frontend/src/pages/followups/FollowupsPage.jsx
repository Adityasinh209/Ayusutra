import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPlans, updatePlanStage } from '../../services/plans.js'
import { listPatients } from '../../services/patients.js'
import { listAppointments } from '../../services/appointments.js'
import PageHeader from '../../components/PageHeader.jsx'
import Card from '../../components/Card.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import Alert from '../../components/Alert.jsx'
import { formatDate } from '../../utils/date.js'

export default function FollowupsPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function loadData() {
    try {
      const [allPlans, allPatients, allAppts] = await Promise.all([
        listPlans(),
        listPatients(),
        listAppointments(),
      ])
      setPlans(allPlans)
      setPatients(allPatients)
      setAppointments(allAppts)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleMarkCompleted(planId) {
    try {
      await updatePlanStage(planId, 'Completed')
      setSuccess('Panchakarma course marked as Completed and discharged.')
      await loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panchakarma Follow-up &amp; Recovery Tracking"
        subtitle="Monitor post-procedure Samsarjana Krama adherence, dosha stabilization, and recovery consultations"
      />

      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-4" />}

      <div className="grid gap-4">
        {plans.map((plan) => {
          const patient = patientMap[plan.patientId]
          const patientAppts = appointments.filter((a) => a.patientId === plan.patientId)
          const completedCount = patientAppts.filter((a) => a.status === 'Completed').length

          return (
            <Card key={plan.id} className="border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">{patient?.fullName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {patient?.prakriti || 'Vata-Pitta'}
                    </span>
                    <Badge label={plan.treatmentStage} />
                  </div>
                  <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                    {plan.procedureName || plan.primaryPanchakarma}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => navigate(`/patients/${plan.patientId}`)}
                  >
                    View Patient EMR
                  </Button>
                  {plan.treatmentStage !== 'Completed' && (
                    <Button
                      size="xs"
                      onClick={() => handleMarkCompleted(plan.id)}
                    >
                       Mark Completed
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 pt-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-stone-400 block mb-0.5">Follow-up Review Date</span>
                  <span className="font-bold text-stone-900 text-sm">
                    {plan.followUpDate ? formatDate(plan.followUpDate) : 'Not scheduled'}
                  </span>
                  <span className="text-[9.5px] text-stone-500 block mt-0.5">
                    Post-procedure pulse &amp; dosha evaluation
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-stone-400 block mb-0.5">Therapy Completion Status</span>
                  <span className="font-bold text-emerald-800 text-sm">
                    {completedCount} / {plan.totalSessions} Sessions Complete
                  </span>
                  <span className="text-[9.5px] text-stone-500 block mt-0.5">
                    Target timeline: {formatDate(plan.startDate)} to {plan.endDate ? formatDate(plan.endDate) : 'Ongoing'}
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-stone-400 block mb-0.5">Current Protocol Stage</span>
                  <span className="font-bold text-stone-800 text-sm">{plan.treatmentStage}</span>
                  <span className="text-[9.5px] text-stone-500 block mt-0.5">
                    Status: {plan.status}
                  </span>
                </div>
              </div>

              {/* Instructions & Pathya guidelines */}
              <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs">
                <div>
                  <p className="font-bold text-stone-800 mb-1"> Doctor Discharge / Follow-up Remarks</p>
                  <p className="text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                    {plan.doctorInstructions || 'Continue mild self-Abhyanga and avoid cold exposures.'}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-stone-800 mb-1"> Post-Karma Diet (Samsarjana Krama)</p>
                  <p className="text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                    {plan.dietPlan || 'Graduated diet starting with warm rice water (Manda) and soup (Yusha).'}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
