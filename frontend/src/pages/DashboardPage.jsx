import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { listPatients, getPatient } from '../services/patients.js'
import { listAppointments, getAppointmentsForPatient } from '../services/appointments.js'
import { listPlans, getPlansForPatient } from '../services/plans.js'
import { listTherapists } from '../services/therapists.js'
import { listRooms } from '../services/rooms.js'
import { listTherapies } from '../services/therapies.js'
import Card, { CardHeader } from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import TextReveal from '../components/TextReveal.jsx'
import { PageSpinner } from '../components/Spinner.jsx'
import { formatDate, formatTime } from '../utils/date.js'



export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [meta, setMeta] = useState({ patients: {}, therapies: {}, therapists: {}, rooms: {} })

  const role = user?.role || 'patient'
  const isPatient = role === 'patient'

  useEffect(() => {
    async function load() {
      try {
        const [therapies, therapists, rooms] = await Promise.all([
          listTherapies(),
          listTherapists(),
          listRooms(),
        ])

        const tMap = Object.fromEntries(therapies.map((t) => [t.id, t]))
        const thMap = Object.fromEntries(therapists.map((th) => [th.id, th]))
        const rMap = Object.fromEntries(rooms.map((r) => [r.id, r]))

        if (isPatient) {
          const patientId = user.patientId || 'patient-1'
          const [patientProfile, myAppts, myPlans] = await Promise.all([
            getPatient(patientId).catch(() => null),
            getAppointmentsForPatient(patientId).catch(() => []),
            getPlansForPatient(patientId).catch(() => []),
          ])

          setMeta({
            patients: patientProfile ? { [patientProfile.id]: patientProfile } : {},
            therapies: tMap,
            therapists: thMap,
            rooms: rMap,
          })

          const activePlan = myPlans.find((p) => p.status === 'In Progress' || p.status === 'Active') || myPlans[0]
          const upcomingAppts = myAppts.filter((a) => a.status !== 'Cancelled')
          const nextAppt = upcomingAppts.find((a) => a.status === 'Scheduled' || a.status === 'Confirmed')
          const completedCount = myAppts.filter((a) => a.status === 'Completed').length

          setData({
            profile: patientProfile,
            activePlan,
            sessions: myAppts,
            nextAppt,
            completedCount,
            totalCount: activePlan?.totalSessions || myAppts.length || 7,
          })
          setLoading(false)
          return
        }

        const [patients, appointments, plans] = await Promise.all([
          listPatients(),
          listAppointments(),
          listPlans(),
        ])

        const today = new Date().toISOString().slice(0, 10)
        const todayAppts = appointments.filter((a) => a.date === today)
        const pMap = Object.fromEntries(patients.map((p) => [p.id, p]))
        setMeta({ patients: pMap, therapies: tMap, therapists: thMap, rooms: rMap })

        const activeTreatments = plans.filter((p) => p.status === 'In Progress' || p.status === 'Active')
        const pradhanaToday = todayAppts.filter((a) => a.treatmentStage === 'Pradhana Karma').length
        const upcomingFollowUps = plans.filter((p) => p.followUpDate && p.followUpDate >= today).length

        const bookedRoomIds = new Set(todayAppts.map((a) => a.roomId))
        const roomUtilization = rooms.length > 0 ? Math.round((bookedRoomIds.size / rooms.length) * 100) : 0

        const currentTherapist = therapists.find((th) => th.email === user.email) || therapists[0]
        const therapistSessions = appointments.filter(
          (a) => a.therapistId === currentTherapist?.id || (a.date === today && a.status !== 'Cancelled')
        )
        const therapistTodaySessions = todayAppts.filter((a) => a.therapistId === currentTherapist?.id)

        setData({
          activeTreatmentsCount: activeTreatments.length,
          todaySessionsCount: todayAppts.length,
          pradhanaToday,
          upcomingFollowUps,
          roomUtilization: `${roomUtilization}%`,
          totalPatientsCount: patients.length,
          activePlans: activeTreatments.slice(0, 3),
          todaySessions: todayAppts.length > 0 ? todayAppts.slice(0, 4) : appointments.slice(0, 4),
          therapistSessions: therapistTodaySessions.length > 0 ? therapistTodaySessions : therapistSessions.slice(0, 4),
          therapistCompletedCount: therapistSessions.filter((a) => a.status === 'Completed').length,
          currentTherapist,
          roomsList: rooms.slice(0, 4),
          bookedRoomIds,
        })
        setLoading(false)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setLoading(false)
      }
    }
    load()
  }, [isPatient, role, user.email, user.patientId])

  if (loading || !data) return <PageSpinner />

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {role === 'doctor' && (
        <DoctorDashboard user={user} data={data} meta={meta} navigate={navigate} />
      )}
      {role === 'receptionist' && (
        <ReceptionistDashboard user={user} data={data} meta={meta} navigate={navigate} />
      )}
      {role === 'therapist' && (
        <TherapistDashboard user={user} data={data} meta={meta} navigate={navigate} />
      )}
      {role === 'patient' && (
        <PatientDashboard user={user} data={data} meta={meta} navigate={navigate} />
      )}
      {role === 'admin' && (
        <DoctorDashboard user={user} data={data} meta={meta} navigate={navigate} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DOCTOR DASHBOARD – 80% white / 20% green ayurvedic theme
// ─────────────────────────────────────────────────────────────────────────────
function DoctorDashboard({ user, data, meta, navigate }) {
  const { activeTreatmentsCount, todaySessionsCount, pradhanaToday, upcomingFollowUps, todaySessions, activePlans } = data

  return (
    <div className="space-y-6">
      <TextReveal delay={0.05}>
        <DashboardBanner
          tag="Vaidya Clinical Console — 80% White / 20% Green"
          title={`Namaste, Dr. ${user.name}`}
          description="Clinical overview in an ayurvedic calm — active Panchakarma courses, detox in Pradhana Karma, and upcoming reviews in white-green harmony."
          primaryAction={{ label: '+ New Assessment', onClick: () => navigate('/consultation') }}
        />
      </TextReveal>

      {/* KPIs with scroll stagger */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TextReveal staggerIndex={0}><StatCard label="Active Patient Plans" value={activeTreatmentsCount} sub="Under clinical supervision" highlight /></TextReveal>
        <TextReveal staggerIndex={1}><StatCard label="Today's Therapies" value={todaySessionsCount} sub="Scheduled across shalas" /></TextReveal>
        <TextReveal staggerIndex={2}><StatCard label="In Pradhana Karma" value={pradhanaToday} sub="Active core elimination" /></TextReveal>
        <TextReveal staggerIndex={3}><StatCard label="Upcoming Reviews" value={upcomingFollowUps} sub="Post-Karma consultations" /></TextReveal>
      </div>

      <OrnamentalDivider />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TextReveal delay={0.05}>
            <Card>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-100">
                <div>
                  <h3 className="text-[16.5px] font-bold text-green-900">Today's Treatment Queue</h3>
                  <p className="text-[14.5px] text-green-700/70">Essential view of therapies being administered today</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/appointments')}>
                  View All Sessions
                </Button>
              </div>

              {todaySessions.length === 0 ? (
                <p className="text-[14.5px] py-6 text-center text-green-700/60">No therapy sessions scheduled today.</p>
              ) : (
                <div className="space-y-2.5">
                  {todaySessions.map((a) => {
                    const patient = meta.patients[a.patientId]
                    const therapy = meta.therapies[a.therapyId]
                    const therapist = meta.therapists[a.therapistId]
                    const room = meta.rooms[a.roomId]
                    return (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:shadow-sm"
                        style={{ backgroundColor: '#ffffff', borderColor: '#dcfce7' }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[16.5px] text-green-900">{patient?.fullName || 'Patient'}</span>
                            <span className="text-[14.5px] font-semibold px-2 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200">
                              {therapy?.name || 'Therapy'}
                            </span>
                            {a.sessionNumber && <span className="text-[12.5px] font-medium text-green-700/60">#{a.sessionNumber}</span>}
                          </div>
                          <p className="text-[14.5px] text-warm-600">
                            {formatTime(a.startTime)}–{formatTime(a.endTime)} · {room?.name || 'Shala'} · {therapist?.name || 'Therapist'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge label={a.treatmentStage || 'Purva Karma'} />
                          <Badge label={a.status} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </TextReveal>

          <TextReveal delay={0.1}>
            <Card>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-100">
                <div>
                  <h3 className="text-[16.5px] font-bold text-green-900">Active Treatment Plans</h3>
                  <p className="text-[14.5px] text-green-700/70">Stage progress of patients undergoing Panchakarma</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/plans')}>View All Plans</Button>
              </div>
              <div className="space-y-3">
                {activePlans.map((plan) => {
                  const patient = meta.patients[plan.patientId]
                  const progress = Math.round(((plan.completedSessions || 0) / (plan.totalSessions || 1)) * 100)
                  return (
                    <div key={plan.id} className="p-3.5 rounded-xl border space-y-2 bg-white" style={{ borderColor: '#dcfce7' }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-[16.5px] text-green-900">{patient?.fullName}</span>
                          <span className="text-[14.5px] ml-2 text-green-600">({patient?.prakriti || 'Vata-Pitta'})</span>
                          <p className="text-[14.5px] font-semibold mt-0.5 text-green-700">{plan.procedureName || plan.primaryPanchakarma}</p>
                        </div>
                        <Badge label={plan.treatmentStage} />
                      </div>
                      <div>
                        <div className="flex justify-between text-[13.5px] mb-1 text-green-700/70">
                          <span>Progress: {plan.completedSessions} of {plan.totalSessions} Sessions</span>
                          <span className="font-semibold text-green-700">{progress}%</span>
                        </div>
                        <div className="w-full rounded-full h-2 overflow-hidden bg-green-100">
                          <div className="h-2 rounded-full transition-all bg-green-600" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </TextReveal>
        </div>

        <div className="space-y-6">
          <TextReveal delay={0.08}>
            <Card>
              <CardHeader title="Clinical Quick Actions" subtitle="Direct patient workflows" />
              <div className="flex flex-col gap-2">
                <QuickNavButton label="New Ayurvedic Assessment" to="/consultation" navigate={navigate} />
                <QuickNavButton label="Panchakarma Plans" to="/plans" navigate={navigate} />
                <QuickNavButton label="Patient EMR Directory" to="/patients" navigate={navigate} />
                <QuickNavButton label="Follow-up Reviews" to="/followups" navigate={navigate} />
              </div>
            </Card>
          </TextReveal>


        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RECEPTIONIST DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function ReceptionistDashboard({ user, data, meta, navigate }) {
  const { todaySessionsCount, roomUtilization, totalPatientsCount, todaySessions, roomsList, bookedRoomIds } = data
  const pendingCheckins = todaySessions.filter((s) => s.status === 'Scheduled').length

  return (
    <div className="space-y-6">
      <TextReveal delay={0.05}>
        <DashboardBanner
          tag="Front Desk & Reception — Herbal Calm"
          title={`Namaste, ${user.name}`}
          description="Patient arrivals, shala assignments and smart scheduling – 80% white breathing space, 20% green focus."
          primaryAction={{ label: 'Register Patient', onClick: () => navigate('/patients/new') }}
        />
      </TextReveal>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TextReveal staggerIndex={0}><StatCard label="Today's Bookings" value={todaySessionsCount} sub="Total scheduled sessions" highlight /></TextReveal>
        <TextReveal staggerIndex={1}><StatCard label="Pending Check-ins" value={pendingCheckins} sub="Awaiting arrival" /></TextReveal>
        <TextReveal staggerIndex={2}><StatCard label="Room Occupancy" value={roomUtilization} sub="Shalas in use" /></TextReveal>
        <TextReveal staggerIndex={3}><StatCard label="Registered Patients" value={totalPatientsCount} sub="Under active care" /></TextReveal>
      </div>

      <OrnamentalDivider />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TextReveal delay={0.05}>
            <Card>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-100">
                <div>
                  <h3 className="text-[16.5px] font-bold text-green-900">Today's Patient Arrival Queue</h3>
                  <p className="text-[14.5px] text-green-700/70">Quick status of patients scheduled today</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/appointments')}>View All Sessions</Button>
              </div>
              <div className="space-y-2.5">
                {todaySessions.map((a) => {
                  const patient = meta.patients[a.patientId]
                  const therapy = meta.therapies[a.therapyId]
                  const room = meta.rooms[a.roomId]
                  return (
                    <div key={a.id} className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white" style={{ borderColor: '#dcfce7' }}>
                      <div className="space-y-0.5">
                        <span className="font-bold text-[16.5px] text-green-900">{patient?.fullName || 'Patient'}</span>
                        <p className="text-[14.5px] text-warm-600">{therapy?.name} · {formatTime(a.startTime)} · {room?.name || 'Shala'}</p>
                      </div>
                      <Badge label={a.status} />
                    </div>
                  )
                })}
              </div>
            </Card>
          </TextReveal>

          <TextReveal delay={0.1}>
            <Card>
              <CardHeader title="Therapy Shalas Status" subtitle="Live room utilization today" />
              <div className="grid sm:grid-cols-2 gap-3">
                {roomsList.map((room) => {
                  const isBooked = bookedRoomIds.has(room.id)
                  return (
                    <div key={room.id} className="p-3 rounded-xl border flex items-center justify-between" style={{ backgroundColor: isBooked ? '#f0fdf4' : '#ffffff', borderColor: isBooked ? '#bbf7d0' : '#dcfce7' }}>
                      <div>
                        <span className="font-bold text-[14.5px] block text-green-900">{room.name}</span>
                        <span className="text-[13.5px] text-green-700/70">{room.type || 'Panchakarma Shala'}</span>
                      </div>
                      <span className="text-[12.5px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: isBooked ? '#fef3c7' : '#dcfce7', color: isBooked ? '#92400e' : '#166534' }}>
                        {isBooked ? 'In Session' : 'Available'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </TextReveal>
        </div>

        <div className="space-y-6">
          <TextReveal delay={0.08}>
            <Card>
              <CardHeader title="Front Desk Actions" subtitle="Quick tasks" />
              <div className="flex flex-col gap-2">
                <QuickNavButton label="Register New Patient" to="/patients/new" navigate={navigate} />
                <QuickNavButton label="All Therapy Sessions" to="/appointments" navigate={navigate} />
                <QuickNavButton label="Treatment Billing" to="/billing" navigate={navigate} />
              </div>
            </Card>
          </TextReveal>

        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. THERAPIST DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function TherapistDashboard({ user, data, meta, navigate }) {
  const { therapistSessions, therapistCompletedCount } = data
  const pendingCount = therapistSessions.filter((s) => s.status === 'Scheduled' || s.status === 'Confirmed').length

  return (
    <div className="space-y-6">
      <TextReveal delay={0.05}>
        <DashboardBanner
          tag="Panchakarma Therapist Portal — Green Harmony"
          title={`Namaste, ${user.name}`}
          description="Your therapy roster, shala assignments and Swedana prep — ayurvedic leaf calm, clinical precision."
          primaryAction={{ label: 'My Session Notes', onClick: () => navigate('/therapist/sessions') }}
        />
      </TextReveal>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TextReveal staggerIndex={0}><StatCard label="Assigned Sessions" value={therapistSessions.length} sub="On your schedule today" highlight /></TextReveal>
        <TextReveal staggerIndex={1}><StatCard label="Pending Treatment" value={pendingCount} sub="Ready for administration" /></TextReveal>
        <TextReveal staggerIndex={2}><StatCard label="Completed Today" value={therapistCompletedCount} sub="Successfully administered" /></TextReveal>
        <TextReveal staggerIndex={3}><StatCard label="Assigned Shala" value="Room 1" sub="Main Snehana Suite" /></TextReveal>
      </div>

      <OrnamentalDivider />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TextReveal delay={0.05}>
            <Card>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-100">
                <div>
                  <h3 className="text-[16.5px] font-bold text-green-900">My Assigned Sessions Today</h3>
                  <p className="text-[14.5px] text-green-700/70">Patients and protocols assigned to your care</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/therapist/sessions')}>Open Full Log</Button>
              </div>
              <div className="space-y-2.5">
                {therapistSessions.map((a) => {
                  const patient = meta.patients[a.patientId]
                  const therapy = meta.therapies[a.therapyId]
                  const room = meta.rooms[a.roomId]
                  return (
                    <div key={a.id} className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white" style={{ borderColor: '#dcfce7' }}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[16.5px] text-green-900">{patient?.fullName || 'Patient'}</span>
                          <span className="text-[14.5px] font-semibold text-green-700">{therapy?.name || 'Therapy'}</span>
                        </div>
                        <p className="text-[14.5px] text-warm-600">{formatTime(a.startTime)}–{formatTime(a.endTime)} · {room?.name || 'Shala'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge label={a.treatmentStage || 'Purva Karma'} />
                        <Badge label={a.status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </TextReveal>

          <TextReveal delay={0.1}>
            <Card>
              <CardHeader title="Pre-Therapy Checklist" subtitle="Ayurvedic clinical standards" />
              <div className="space-y-2 text-[14.5px] text-green-900">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer hover:bg-green-50/60" style={{ borderColor: '#dcfce7' }}>
                  <input type="checkbox" defaultChecked className="accent-green-600" />
                  <span>Verify medicated Thailam temperature before Abhyanga / Pizhichil.</span>
                </label>
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer hover:bg-green-50/60" style={{ borderColor: '#dcfce7' }}>
                  <input type="checkbox" defaultChecked className="accent-green-600" />
                  <span>Ensure Swedana steam chamber pre-warmed.</span>
                </label>
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer hover:bg-green-50/60" style={{ borderColor: '#dcfce7' }}>
                  <input type="checkbox" className="accent-green-600" />
                  <span>Check vitals & light stomach prior to therapy.</span>
                </label>
              </div>
            </Card>
          </TextReveal>
        </div>

        <div className="space-y-6">
          <TextReveal delay={0.08}>
            <Card>
              <CardHeader title="Therapist Actions" subtitle="Quick tasks" />
              <div className="flex flex-col gap-2">
                <QuickNavButton label="Log Session Details" to="/therapist/sessions" navigate={navigate} />
                {/* <QuickNavButton label="Check Herbal Consumables" to="/inventory" navigate={navigate} /> */}
              </div>
            </Card>
          </TextReveal>

        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PATIENT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function PatientDashboard({ user, data, meta, navigate }) {
  const { profile, activePlan, nextAppt, completedCount, totalCount } = data
  const progress = Math.round(((activePlan?.completedSessions || completedCount || 0) / (activePlan?.totalSessions || totalCount || 1)) * 100)

  return (
    <div className="space-y-6">
      <TextReveal delay={0.05}>
        <DashboardBanner
          tag="Patient Healing Portal — Prakriti Harmony"
          title={`Namaste, ${user.name}`}
          description={`Prakriti: ${profile?.prakriti || 'Vata-Pitta'} · Prescribed Panchakarma in 80% white calm, 20% herbal green.`}
          primaryAction={{ label: 'My Complete Plan', onClick: () => navigate(`/patients/${user.patientId || 'patient-1'}`) }}
          secondaryAction={{ label: 'Ask Assistant', onClick: () => navigate('/assistant') }}
        />
      </TextReveal>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextReveal staggerIndex={0}><StatCard label="Active Protocol" value={activePlan?.procedureName || 'Panchakarma Protocol'} sub={`Stage: ${activePlan?.treatmentStage || 'Purva Karma'}`} highlight /></TextReveal>
        <TextReveal staggerIndex={1}><StatCard label="Treatment Progress" value={`${activePlan?.completedSessions || completedCount} of ${activePlan?.totalSessions || totalCount} Done`} sub={`${progress}% course completed`} /></TextReveal>
        <TextReveal staggerIndex={2}><StatCard label="Next Session" value={nextAppt ? formatDate(nextAppt.date) : 'No Upcoming'} sub={nextAppt ? `${formatTime(nextAppt.startTime)} in ${meta.rooms[nextAppt.roomId]?.name || 'Shala'}` : 'Schedule with clinic'} /></TextReveal>
      </div>

      <OrnamentalDivider />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {nextAppt && (
            <TextReveal delay={0.05}>
              <div className="rounded-2xl p-5 border border-green-200 flex items-start justify-between overflow-hidden relative" style={{ backgroundColor: '#f0fdf4' }}>
                <div className="relative">
                  <span className="text-[14.5px] font-semibold uppercase tracking-wider block mb-1 text-green-700">Next Scheduled Treatment</span>
                  <h3 className="text-[20.5px] font-bold text-green-900">{meta.therapies[nextAppt.therapyId]?.name || 'Therapy Session'}</h3>
                  <p className="text-[14.5px] mt-1 text-green-800/70">{formatDate(nextAppt.date)} at {formatTime(nextAppt.startTime)} · {meta.rooms[nextAppt.roomId]?.name || 'Shala'}</p>
                </div>
                <Badge label={nextAppt.status} />
              </div>
            </TextReveal>
          )}

          <TextReveal delay={0.1}>
            <Card>
              <CardHeader title="Daily Pathya (Diet & Care Guidelines)" subtitle="Prescribed by your Vaidya to enhance therapeutic benefits" />
              <div className="p-4 rounded-xl border space-y-2 text-[14.5px]" style={{ backgroundColor: '#ffffff', borderColor: '#dcfce7' }}>
                <span className="font-bold block text-green-700">Prescribed Diet:</span>
                <p className="leading-relaxed text-green-900/80">{activePlan?.dietPlan || 'Freshly prepared warm foods (Manda/Yusha/Khichdi). Avoid chilled beverages, deep fried snacks, and heavy curds during active therapy.'}</p>
                <div className="pt-2 border-t mt-2 border-green-100">
                  <span className="font-bold block text-green-700">Physician Note:</span>
                  <p className="leading-relaxed text-green-900/80">{activePlan?.doctorInstructions || 'Keep yourself warm and well-hydrated with boiled cumin water after your session. Avoid day sleep.'}</p>
                </div>
              </div>
            </Card>
          </TextReveal>


        </div>

        <div className="space-y-6">
          <TextReveal delay={0.08}>
            <Card>
              <CardHeader title="Patient Shortcuts" subtitle="Your health portal" />
              <div className="flex flex-col gap-2">
                <QuickNavButton label="My Therapy Sessions" to="/appointments" navigate={navigate} />
                <QuickNavButton label="Full Constitutional Profile" to={`/patients/${user.patientId || 'patient-1'}`} navigate={navigate} />
                <QuickNavButton label="Ask AyurSutra Assistant" to="/assistant" navigate={navigate} />
              </div>
            </Card>
          </TextReveal>

        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE: 80% white / 20% green banner + leaf ornaments + scroll harmony
// ─────────────────────────────────────────────────────────────────────────────
function DashboardBanner({ tag, title, description, primaryAction, secondaryAction }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      style={{
        background: 'linear-gradient(135deg, #15803d 0%, #166534 55%, #14532d 100%)',
        color: '#ffffff',
      }}
    >
      <div className="relative z-10">
        {tag && (
          <span className="inline-block px-3 py-0.5 rounded-full text-[13.5px] font-semibold tracking-wider uppercase border mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#dcfce7', borderColor: 'rgba(220,252,231,0.35)' }}>
            {tag}
          </span>
        )}
        <h1 className="text-[22.5px] sm:text-[26.5px] font-bold tracking-tight" style={{ fontFamily: "'EB Garamond', serif" }}>
          {title}
        </h1>
        <p className="text-[14.5px] mt-1.5 max-w-xl leading-relaxed" style={{ color: 'rgba(240,253,244,0.88)' }}>
          {description}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2.5 shrink-0">
        {secondaryAction && (
          <button type="button" onClick={secondaryAction.onClick} className="px-3.5 py-2 rounded-xl text-[14.5px] font-semibold cursor-pointer border transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.28)', color: '#ffffff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.20)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}>
            {secondaryAction.label}
          </button>
        )}
        {primaryAction && (
          <button type="button" onClick={primaryAction.onClick} className="px-4 py-2 rounded-xl text-[14.5px] font-bold cursor-pointer transition-all shadow-sm bg-white text-green-800 hover:bg-green-50 border border-white">
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  )
}

function OrnamentalDivider() {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="w-full max-w-xl h-px bg-green-100" />
    </div>
  )
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className="p-4 rounded-2xl border transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 duration-300" style={{ backgroundColor: highlight ? '#f0fdf4' : '#ffffff', borderColor: highlight ? '#bbf7d0' : '#dcfce7' }}>
      <div className="mb-1.5">
        <span className="text-[22.5px] sm:text-[26.5px] font-bold" style={{ color: highlight ? '#15803d' : '#14532d', fontFamily: "'EB Garamond', serif" }}>
          {value}
        </span>
      </div>
      <p className="text-[14.5px] font-bold text-green-900">{label}</p>
      {sub && <p className="text-[13.5px] mt-0.5 truncate text-green-700/60">{sub}</p>}
    </div>
  )
}

function QuickNavButton({ label, to, navigate }) {
  return (
    <button onClick={() => navigate(to)} className="w-full text-left px-3.5 py-2.5 rounded-xl border text-[14.5px] font-semibold transition-all cursor-pointer bg-white text-green-900 hover:bg-green-50 hover:border-green-300 hover:text-green-800" style={{ borderColor: '#dcfce7' }}>
      <span>{label}</span>
    </button>
  )
}
