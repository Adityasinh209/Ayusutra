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
import { PageSpinner } from '../components/Spinner.jsx'
import { formatDate, formatTime } from '../utils/date.js'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [todaySessions, setTodaySessions] = useState([])
  const [activePlans, setActivePlans] = useState([])
  const [patientData, setPatientData] = useState(null)
  const [meta, setMeta] = useState({ patients: {}, therapies: {}, therapists: {}, rooms: {} })

  const isPatient = user?.role === 'patient'

  useEffect(() => {
    async function load() {
      const [therapies, therapists, rooms] = await Promise.all([
        listTherapies(),
        listTherapists(),
        listRooms(),
      ])

      const tMap = Object.fromEntries(therapies.map((t) => [t.id, t]))
      const thMap = Object.fromEntries(therapists.map((th) => [th.id, th]))
      const rMap = Object.fromEntries(rooms.map((r) => [r.id, r]))

      if (isPatient) {
        // Patient Privacy Sandbox: ONLY load this patient's own records
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

        setPatientData({
          profile: patientProfile,
          activePlan,
          sessions: myAppts,
          nextAppt,
          completedCount,
          totalCount: activePlan?.totalSessions || myAppts.length,
        })
        setStats({ isPatient: true })
        return
      }

      // Staff / Doctor / Admin View: Load center-wide statistics
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
      const purvaKarmaCount = plans.filter((p) => p.treatmentStage === 'Purva Karma').length
      const pradhanaKarmaToday = todayAppts.filter((a) => a.treatmentStage === 'Pradhana Karma').length
      const paschatKarmaCount = plans.filter((p) => p.treatmentStage === 'Paschat Karma').length
      const completedSessions = appointments.filter((a) => a.status === 'Completed').length
      const pendingSessions = appointments.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed').length

      const bookedTherapistIds = new Set(todayAppts.map((a) => a.therapistId))
      const therapistUtilization = therapists.length > 0
        ? Math.round((bookedTherapistIds.size / therapists.length) * 100)
        : 0

      const bookedRoomIds = new Set(todayAppts.map((a) => a.roomId))
      const roomUtilization = rooms.length > 0
        ? Math.round((bookedRoomIds.size / rooms.length) * 100)
        : 0

      const upcomingFollowUps = plans.filter((p) => p.followUpDate && p.followUpDate >= today).length

      setStats({
        activeTreatments: activeTreatments.length,
        todaySessionsCount: todayAppts.length,
        pendingPurvaKarma: purvaKarmaCount,
        todayPradhanaKarma: pradhanaKarmaToday,
        patientsInPaschatKarma: paschatKarmaCount,
        completedSessions,
        pendingSessions,
        therapistUtilization: `${therapistUtilization}%`,
        roomUtilization: `${roomUtilization}%`,
        upcomingFollowUps,
      })

      setTodaySessions(todayAppts.length > 0 ? todayAppts : appointments.slice(0, 5))
      setActivePlans(activeTreatments.slice(0, 4))
    }
    load()
  }, [isPatient, user?.patientId])

  if (!stats) return <PageSpinner />

  // ─────────────────────────────────────────────────────────────────────────────
  // PATIENT-SPECIFIC SECURE DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (isPatient) {
    const { profile, activePlan, sessions, nextAppt, completedCount, totalCount } = patientData || {}
    const progress = Math.round(((activePlan?.completedSessions || completedCount || 0) / (activePlan?.totalSessions || totalCount || 1)) * 100)

    return (
      <div className="space-y-6">
        {/* Patient Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-[11px] font-semibold tracking-wide uppercase border border-emerald-500/30">
                Panchakarma Patient Portal
              </span>
              <span className="text-xs text-emerald-200">
                Prakriti: <strong>{profile?.prakriti || 'Vata-Pitta'}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Namaste, {user.name}</h1>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
              Track your active Panchakarma healing protocol, session sequence, Pathya diet guidelines, and recovery milestones.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
              onClick={() => navigate('/assistant')}
            >
              🤖 Ask Assistant
            </Button>
            <Button
              size="sm"
              className="!bg-emerald-500 hover:!bg-emerald-400 !text-white border-0 shadow-sm"
              onClick={() => navigate(`/patients/${user.patientId || 'patient-1'}`)}
            >
              View My Plan Details →
            </Button>
          </div>
        </div>

        {/* Patient Individual Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-500 font-semibold block mb-1">🌿 Active Protocol</span>
            <span className="text-base font-bold text-emerald-900 block truncate">
              {activePlan?.procedureName || activePlan?.primaryPanchakarma || 'Under Consultation'}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">
              Stage: <strong>{activePlan?.treatmentStage || 'Purva Karma'}</strong>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-500 font-semibold block mb-1">⏳ Session Progress</span>
            <span className="text-base font-bold text-stone-900 block">
              {activePlan?.completedSessions || completedCount} of {activePlan?.totalSessions || totalCount} Done
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">{progress}% Completed</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-500 font-semibold block mb-1">📅 Next Scheduled Session</span>
            <span className="text-sm font-bold text-stone-900 block">
              {nextAppt ? `${formatDate(nextAppt.date)}` : 'No upcoming session'}
            </span>
            {nextAppt && (
              <span className="text-[11px] text-stone-500 block mt-0.5">
                {formatTime(nextAppt.startTime)} · {meta.rooms[nextAppt.roomId]?.name || 'Shala'}
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
            <span className="text-xs text-stone-500 font-semibold block mb-1">📋 Follow-up Review</span>
            <span className="text-sm font-bold text-stone-900 block">
              {activePlan?.followUpDate ? formatDate(activePlan.followUpDate) : 'Pending Schedule'}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">Post-Karma Consultation</span>
          </div>
        </div>

        {/* Active Plan Card + Next Sessions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Plan Detail */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-emerald-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    {activePlan?.procedureName || 'Panchakarma Treatment Plan'}
                  </h3>
                  <p className="text-xs text-stone-500">Supervised by Dr. Meera Nair (Vaidya)</p>
                </div>
                <Badge label={activePlan?.treatmentStage || 'Purva Karma'} />
              </div>

              <div className="space-y-4 pt-3 text-xs">
                {/* Visual Progress */}
                <div>
                  <div className="flex justify-between text-stone-600 mb-1 font-medium">
                    <span>Course Completion: {progress}%</span>
                    <span>{activePlan?.completedSessions || 0} / {activePlan?.totalSessions || 7} Sessions</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Pathya-Apathya Diet and Care */}
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="font-bold text-stone-800 block mb-1">🥣 Recommended Diet (Pathya)</span>
                    <p className="text-stone-600 leading-relaxed">
                      {activePlan?.dietPlan || 'Warm unctuous freshly cooked food (Manda/Yusha). Avoid cold water, heavy meals, and raw salads.'}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="font-bold text-stone-800 block mb-1">📋 Vaidya Instructions</span>
                    <p className="text-stone-600 leading-relaxed">
                      {activePlan?.doctorInstructions || 'Avoid cold air currents and direct sun exposure post-therapy.'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* My Upcoming Sessions */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-stone-900">My Therapy Sessions</h3>
                <Button size="xs" variant="ghost" onClick={() => navigate('/appointments')}>
                  View All Sessions →
                </Button>
              </div>

              <div className="space-y-2.5">
                {sessions.length === 0 ? (
                  <p className="text-xs text-stone-400 py-4 text-center">No therapy sessions on record.</p>
                ) : (
                  sessions.slice(0, 4).map((a) => {
                    const therapy = meta.therapies[a.therapyId]
                    const therapist = meta.therapists[a.therapistId]
                    const room = meta.rooms[a.roomId]

                    return (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl border border-stone-100 bg-stone-50/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{therapy?.name || 'Therapy'}</span>
                            {a.sessionNumber && (
                              <span className="text-[10px] text-stone-500 font-medium">Session #{a.sessionNumber}</span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium">
                              {a.treatmentStage || 'Purva Karma'}
                            </span>
                          </div>
                          <p className="text-stone-500">
                            📅 {formatDate(a.date)} · 🕒 {formatTime(a.startTime)}–{formatTime(a.endTime)} · 🏛️ {room?.name} · ✋ {therapist?.name}
                          </p>
                        </div>
                        <Badge label={a.status} />
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Quick Guidance for Patient */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="Patient Quick Actions" />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate('/appointments')}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs font-semibold text-stone-800 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>⏳ My Therapy Sessions</span>
                  <span className="text-stone-400">→</span>
                </button>
                <button
                  onClick={() => navigate(`/patients/${user.patientId || 'patient-1'}`)}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs font-semibold text-stone-800 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>🌿 Full Constitutional Profile</span>
                  <span className="text-stone-400">→</span>
                </button>
                <button
                  onClick={() => navigate('/assistant')}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs font-semibold text-stone-800 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>🤖 Ask AyurSutra Assistant</span>
                  <span className="text-stone-400">→</span>
                </button>
              </div>
            </Card>

            <Card className="bg-emerald-50/40 border-emerald-200 text-xs space-y-2">
              <span className="font-bold text-emerald-900 block">🪔 Daily Panchakarma Reminders</span>
              <ul className="space-y-1.5 text-stone-600 list-disc list-inside text-[11px]">
                <li>Drink warm water boiled with ginger/cumin.</li>
                <li>Avoid daytime sleeping during active Snehana.</li>
                <li>Report any localized changes to your therapist.</li>
                <li>Maintain peaceful rest after every session.</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CLINICAL / RECEPTIONIST / ADMIN DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  const quickLinks =
    user.role === 'doctor'
      ? [
          { label: '🩺 New Ayurvedic Assessment', to: '/consultation' },
          { label: '🌿 Panchakarma Plans', to: '/plans' },
          { label: '👥 Patient EMR Directory', to: '/patients' },
          { label: '📋 Follow-up Reviews', to: '/followups' },
        ]
      : user.role === 'receptionist'
      ? [
          { label: '✨ AI Smart Scheduler', to: '/scheduling' },
          { label: '👤 Register New Patient', to: '/patients/new' },
          { label: '⏳ Therapy Sessions', to: '/appointments' },
          { label: '💳 Package Billing', to: '/billing' },
        ]
      : user.role === 'therapist'
      ? [
          { label: '✋ My Assigned Sessions', to: '/therapist/sessions' },
          { label: '🧪 Therapy Consumables', to: '/inventory' },
          { label: '🤖 Panchakarma Assistant', to: '/assistant' },
        ]
      : [
          { label: '🌿 Panchakarma Plans', to: '/plans' },
          { label: '🏛️ Masters & Rooms', to: '/masters' },
          { label: '🧪 Herbal Inventory', to: '/inventory' },
          { label: '💳 Billing & Packages', to: '/billing' },
        ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-[11px] font-semibold tracking-wide uppercase border border-emerald-500/30">
              Panchakarma Center Console
            </span>
            <span className="text-xs text-emerald-200">AyurSutra v2.0</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Namaste, {user.name}</h1>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
            {user.role === 'doctor'
              ? 'Dosha balance evaluation, Panchakarma stage management, and therapeutic clinical tracking.'
              : user.role === 'therapist'
              ? 'Track daily assigned therapy sessions, observe patient tissue responses, and log completions.'
              : user.role === 'receptionist'
              ? 'Coordinate patient intake, optimize therapy room turnovers, and schedule multi-stage therapies.'
              : 'Holistic clinical oversight of therapies, room occupancy, therapist rosters, and inventory.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
            onClick={() => navigate('/assistant')}
          >
            🤖 AI Assistant
          </Button>
          {(user.role === 'doctor' || user.role === 'admin') && (
            <Button
              size="sm"
              className="!bg-emerald-500 hover:!bg-emerald-400 !text-white border-0 shadow-sm"
              onClick={() => navigate('/consultation')}
            >
              + New Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Panchakarma Specific KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Panchakarma Clinical Operations KPIs
          </h2>
          <span className="text-[11px] text-stone-400">Live Stage &amp; Facility Metrics</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <StatCard
            label="Active Treatments"
            value={stats.activeTreatments}
            sub="Under active protocol"
            icon="🌿"
            highlight
          />
          <StatCard
            label="Today's Sessions"
            value={stats.todaySessionsCount}
            sub={`${stats.pendingSessions} pending`}
            icon="⏳"
          />
          <StatCard
            label="In Purva Karma"
            value={stats.pendingPurvaKarma}
            sub="Snehana & Swedana"
            icon="🪔"
          />
          <StatCard
            label="Today's Pradhana Karma"
            value={stats.todayPradhanaKarma}
            sub="Basti / Nasya / Vamana"
            icon="🔥"
          />
          <StatCard
            label="In Paschat Karma"
            value={stats.patientsInPaschatKarma}
            sub="Diet & Samsarjana"
            icon="🥣"
          />
          <StatCard
            label="Sessions Completed"
            value={stats.completedSessions}
            sub="Lifetime prototype total"
            icon="✅"
          />
          <StatCard
            label="Therapist Utilization"
            value={stats.therapistUtilization}
            sub="Rostered workload"
            icon="✋"
          />
          <StatCard
            label="Room Utilization"
            value={stats.roomUtilization}
            sub="Shala & Kutir occupancy"
            icon="🏛️"
          />
          <StatCard
            label="Pending Sessions"
            value={stats.pendingSessions}
            sub="Scheduled ahead"
            icon="📅"
          />
          <StatCard
            label="Upcoming Follow-ups"
            value={stats.upcomingFollowUps}
            sub="Post-Karma review"
            icon="📋"
          />
        </div>
      </div>

      {/* Main Grid: Sessions Queue + Plans Progress + Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Sessions & Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Therapy Sessions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Today's Therapy Sessions Queue</h3>
                <p className="text-xs text-stone-500">Therapy room assignments, therapist, and clinical stage</p>
              </div>
              <Button size="xs" variant="ghost" onClick={() => navigate('/appointments')}>
                View All →
              </Button>
            </div>

            {todaySessions.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">No therapy sessions scheduled for today.</p>
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
                      className="p-3 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-stone-900">
                            {patient?.fullName || 'Patient'}
                          </span>
                          <span className="text-xs text-stone-400">·</span>
                          <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {therapy?.name || 'Therapy'}
                          </span>
                          {a.sessionNumber && (
                            <span className="text-[10px] text-stone-500 font-medium">
                              Session #{a.sessionNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                          <span>🕒 {formatTime(a.startTime)} – {formatTime(a.endTime)}</span>
                          <span>🏛️ {room?.name || 'Room'}</span>
                          <span>✋ {therapist?.name || 'Therapist'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                            a.treatmentStage === 'Pradhana Karma'
                              ? 'bg-amber-100 text-amber-800'
                              : a.treatmentStage === 'Paschat Karma'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {a.treatmentStage || 'Purva Karma'}
                        </span>
                        <Badge label={a.status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Active Panchakarma Treatment Plans */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Active Panchakarma Treatment Plans</h3>
                <p className="text-xs text-stone-500">Progress through Purva, Pradhana, and Paschat Karma</p>
              </div>
              <Button size="xs" variant="ghost" onClick={() => navigate('/plans')}>
                View All Plans →
              </Button>
            </div>

            <div className="space-y-3">
              {activePlans.map((plan) => {
                const patient = meta.patients[plan.patientId]
                const therapist = meta.therapists[plan.assignedTherapistId]
                const progress = Math.round(((plan.completedSessions || 0) / (plan.totalSessions || 1)) * 100)

                return (
                  <div key={plan.id} className="p-3.5 rounded-xl border border-stone-200 bg-white space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-sm text-stone-900">{patient?.fullName}</span>
                        <span className="text-xs text-stone-500 ml-2">({patient?.prakriti || 'Prakriti N/A'})</span>
                        <p className="text-xs text-emerald-800 font-medium mt-0.5">
                          {plan.procedureName || plan.primaryPanchakarma}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                        {plan.treatmentStage}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-stone-500 mb-1">
                        <span>Sessions: {plan.completedSessions} of {plan.totalSessions} completed</span>
                        <span className="font-medium text-stone-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-100">
                      <span>Therapist: {therapist?.name || 'Assigned Vaidya team'}</span>
                      {plan.followUpDate && <span>Follow-up: {formatDate(plan.followUpDate)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Col: Quick Actions & Stage Workflow Guide */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Clinical Quick Actions" subtitle="Role-specific tasks" />
            <div className="flex flex-col gap-2">
              {quickLinks.map((l) => (
                <button
                  key={l.to}
                  onClick={() => navigate(l.to)}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs font-semibold text-stone-800 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>{l.label}</span>
                  <span className="text-stone-400 text-sm">→</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Panchakarma Clinical Workflow Guide */}
          <Card className="bg-gradient-to-br from-emerald-50/50 to-stone-50 border-emerald-200">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
              Panchakarma Stage Progression
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              Standard clinical continuum maintained across all therapy courses:
            </p>
            <ol className="space-y-2 text-xs text-stone-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">1.</span>
                <span><strong>Purva Karma:</strong> Deepana, Pachana, Snehana (Abhyanga), and Swedana to liquefy Ama.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">2.</span>
                <span><strong>Pradhana Karma:</strong> Primary elimination (Basti, Nasya, Vamana, Virechana).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">3.</span>
                <span><strong>Paschat Karma:</strong> Samsarjana Krama (graduated diet), Rasayana rejuvenation &amp; lifestyle.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">4.</span>
                <span><strong>Follow-up:</strong> Nadi assessment, Dosha re-evaluation, and post-cleanse stabilization.</span>
              </li>
            </ol>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, highlight }) {
  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        highlight
          ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
          : 'bg-white border-stone-200'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xl font-bold text-stone-900">{value}</span>
      </div>
      <p className="text-xs font-semibold text-stone-700 leading-tight">{label}</p>
      {sub && <p className="text-[10px] text-stone-400 mt-0.5 truncate">{sub}</p>}
    </div>
  )
}
