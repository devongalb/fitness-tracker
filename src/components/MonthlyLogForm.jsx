import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const strengthCategories = [
  {
    key: 'bench',
    label: 'Bench',
    matches: ['bench', 'bench press', 'incline bench', 'dumbbell bench']
  },
  {
    key: 'squat',
    label: 'Squat',
    matches: ['squat', 'back squat', 'front squat', 'goblet squat']
  },
  {
    key: 'deadlift',
    label: 'Deadlift',
    matches: ['deadlift', 'romanian deadlift', 'rdl', 'trap bar deadlift']
  }
]

function monthNameFromDate(dateString) {
  if (!dateString) return ''
  const parsed = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleString('en-US', { month: 'long' })
}

function normalizeExerciseName(name) {
  return (name || '').trim().toLowerCase()
}

function matchesCategory(exerciseName, category) {
  const normalized = normalizeExerciseName(exerciseName)
  return category.matches.some((term) => normalized.includes(term))
}

function MonthlyLogForm({ profile }) {
  const [monthlyForm, setMonthlyForm] = useState({
    month: '',
    notes: ''
  })
  const [dailyLogs, setDailyLogs] = useState([])
  const [loadingTrends, setLoadingTrends] = useState(true)

  useEffect(() => {
    const loadDailyLogs = async () => {
      if (!profile?.id) {
        setDailyLogs([])
        setLoadingTrends(false)
        return
      }

      setLoadingTrends(true)

      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('profile_id', profile.id)
        .order('date', { ascending: true })

      if (error) {
        console.error('Error loading monthly strength trends:', error)
        setDailyLogs([])
        setLoadingTrends(false)
        return
      }

      setDailyLogs(data || [])
      setLoadingTrends(false)
    }

    loadDailyLogs()
  }, [profile])

  const selectedMonthLogs = useMemo(() => {
    if (!monthlyForm.month) return []
    return dailyLogs.filter((log) => monthNameFromDate(log.date) === monthlyForm.month)
  }, [dailyLogs, monthlyForm.month])

  const strengthTrends = useMemo(() => {
    return strengthCategories.map((category) => {
      const matchingEntries = selectedMonthLogs.flatMap((log) => {
        const entries = []

        if (matchesCategory(log.exercise1, category) && log.exercise1_weight != null) {
          entries.push({
            exercise: log.exercise1,
            weight: Number(log.exercise1_weight),
            date: log.date
          })
        }

        if (matchesCategory(log.exercise2, category) && log.exercise2_weight != null) {
          entries.push({
            exercise: log.exercise2,
            weight: Number(log.exercise2_weight),
            date: log.date
          })
        }

        return entries
      })

      if (matchingEntries.length === 0) {
        return {
          key: category.key,
          label: category.label,
          entries: [],
          startWeight: null,
          bestWeight: null,
          latestWeight: null,
          change: null,
          bestChange: null
        }
      }

      const sortedEntries = [...matchingEntries].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      )

      const startWeight = sortedEntries[0].weight
      const latestWeight = sortedEntries[sortedEntries.length - 1].weight
      const bestWeight = Math.max(...sortedEntries.map((entry) => entry.weight))

      return {
        key: category.key,
        label: category.label,
        entries: sortedEntries,
        startWeight,
        bestWeight,
        latestWeight,
        change: latestWeight - startWeight,
        bestChange: bestWeight - startWeight
      }
    })
  }, [selectedMonthLogs])

  const monthlySummary = useMemo(() => {
    const workoutsLogged = selectedMonthLogs.length
    const workoutDays = selectedMonthLogs.filter(
      (log) => normalizeExerciseName(log.workout_focus) !== 'rest day'
    ).length
    const restDays = selectedMonthLogs.filter(
      (log) => normalizeExerciseName(log.workout_focus) === 'rest day'
    ).length
    const cardioSessions = selectedMonthLogs.filter(
      (log) => Number(log.cardio_duration || 0) > 0
    ).length
    const cardioMinutes = selectedMonthLogs.reduce(
      (total, log) => total + Number(log.cardio_duration || 0),
      0
    )
    const totalVolumeLifted = selectedMonthLogs.reduce((total, log) => {
      const exercise1Volume = Number(log.exercise1_weight || 0) * Number(log.exercise1_reps || 0)
      const exercise2Volume = Number(log.exercise2_weight || 0) * Number(log.exercise2_reps || 0)
      return total + exercise1Volume + exercise2Volume
    }, 0)
    const totalTrackedLifts = strengthTrends.reduce(
      (count, trend) => count + trend.entries.length,
      0
    )

    return {
      workoutsLogged,
      workoutDays,
      restDays,
      cardioSessions,
      cardioMinutes,
      totalVolumeLifted,
      totalTrackedLifts
    }
  }, [selectedMonthLogs, strengthTrends])

  const handleChange = (e) => {
    const { name, value } = e.target
    setMonthlyForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!profile?.id) {
      alert('No profile found for this account.')
      return
    }

    const newLog = {
      profile_id: profile.id,
      user_id: profile.id,
      month: monthlyForm.month,
      notes: monthlyForm.notes
    }

    const { error } = await supabase.from('monthly_logs').insert([newLog])

    if (error) {
      console.error('Error saving monthly log:', error)
      alert('Failed to save monthly notes')
      return
    }

    alert('Monthly notes saved')

    setMonthlyForm({
      month: '',
      notes: ''
    })
  }

  return (
    <div className="page-container">
      <h2>Monthly Review</h2>
      <p className="form-helper-text">
        Review your month using trends pulled from daily logs, then save a short monthly reflection.
      </p>

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-section">
          <h3 className="form-section-title">Select Month</h3>

          <label className="form-label">Month</label>
          <select
            className="form-input"
            name="month"
            value={monthlyForm.month}
            onChange={handleChange}
            required
          >
            <option value="">Select a month</option>
            {MONTH_OPTIONS.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Monthly Review Dashboard</h3>

          {!monthlyForm.month ? (
            <p className="form-helper-text">Select a month to review your training trends.</p>
          ) : loadingTrends ? (
            <p className="form-helper-text">Loading monthly trends...</p>
          ) : (
            <>
              <p><strong>Daily Logs This Month:</strong> {monthlySummary.workoutsLogged}</p>
              <p><strong>Workout Days:</strong> {monthlySummary.workoutDays}</p>
              <p><strong>Rest Days:</strong> {monthlySummary.restDays}</p>
              <p><strong>Cardio Sessions:</strong> {monthlySummary.cardioSessions}</p>
              <p><strong>Total Cardio Time:</strong> {monthlySummary.cardioMinutes} minutes</p>
              <p><strong>Total Volume Lifted:</strong> {monthlySummary.totalVolumeLifted} lbs</p>
              <p><strong>Tracked Strength Entries:</strong> {monthlySummary.totalTrackedLifts}</p>

              {strengthTrends.map((trend) => (
                <div key={trend.key} className="history-card">
                  <h4 className="history-card-title">{trend.label}</h4>

                  {trend.entries.length === 0 ? (
                    <p>No {trend.label.toLowerCase()} entries found in daily logs for {monthlyForm.month}.</p>
                  ) : (
                    <>
                      <p><strong>First Logged Weight:</strong> {trend.startWeight} lbs</p>
                      <p><strong>Latest Logged Weight:</strong> {trend.latestWeight} lbs</p>
                      <p><strong>Best Weight This Month:</strong> {trend.bestWeight} lbs</p>
                      <p>
                        <strong>Change (First → Latest):</strong>{' '}
                        {trend.change > 0 ? '+' : ''}
                        {trend.change} lbs
                      </p>
                      <p>
                        <strong>Change (First → Best):</strong>{' '}
                        {trend.bestChange > 0 ? '+' : ''}
                        {trend.bestChange} lbs
                      </p>
                    </>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Monthly Reflection</h3>

          <label className="form-label">Monthly Review Notes</label>
          <textarea
            className="form-textarea"
            name="notes"
            value={monthlyForm.notes}
            onChange={handleChange}
            placeholder="Biggest progress this month, what improved most, and what to focus on next month..."
            rows={4}
          />
        </div>

        <button className="form-button" type="submit">
          Save Monthly Notes
        </button>
      </form>
    </div>
  )
}

export default MonthlyLogForm