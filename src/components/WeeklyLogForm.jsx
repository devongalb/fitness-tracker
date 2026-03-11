import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'


function normalizeExerciseName(name) {
    return (name || '').trim().toLowerCase()
}


function formatDateForInput(date) {
    return date.toLocaleDateString('en-CA')
}

function addDays(dateString, days) {
    const date = new Date(`${dateString}T00:00:00`)
    date.setDate(date.getDate() + days)
    return formatDateForInput(date)
}

function WeeklyLogForm({ profile }) {
    const [weeklyForm, setWeeklyForm] = useState({
        weekStart: '',
        weight: '',
        waist: '',
        biggestWin: '',
        biggestChallenge: '',
        recoveryRating: '',
        nextWeekFocus: '',
        notes: ''
    })
    const [dailyLogs, setDailyLogs] = useState([])
    const [weeklyLogs, setWeeklyLogs] = useState([])
    const [loadingSummary, setLoadingSummary] = useState(true)

    useEffect(() => {
        const today = new Date()
        const dayOfWeek = today.getDay()
        const daysSinceMonday = (dayOfWeek + 6) % 7
        const monday = new Date(today)
        monday.setDate(today.getDate() - daysSinceMonday)

        setWeeklyForm((prev) => ({
            ...prev,
            weekStart: prev.weekStart || formatDateForInput(monday)
        }))
    }, [])

    useEffect(() => {
        const loadWeeklyData = async () => {
            if (!profile?.id) {
                setDailyLogs([])
                setWeeklyLogs([])
                setLoadingSummary(false)
                return
            }

            setLoadingSummary(true)

            const [
                { data: dailyData, error: dailyError },
                { data: weeklyData, error: weeklyError }
            ] = await Promise.all([
                supabase
                    .from('daily_logs')
                    .select('*')
                    .eq('profile_id', profile.id)
                    .order('date', { ascending: true }),
                supabase
                    .from('weekly_logs')
                    .select('*')
                    .eq('profile_id', profile.id)
                    .order('week_start', { ascending: true })
            ])

            if (dailyError) {
                console.error('Error loading weekly daily logs:', dailyError)
            }

            if (weeklyError) {
                console.error('Error loading weekly progress logs:', weeklyError)
            }

            setDailyLogs(dailyData || [])
            setWeeklyLogs(weeklyData || [])
            setLoadingSummary(false)
        }

        loadWeeklyData()
    }, [profile])

    const handleChange = (e) => {
        const { name, value } = e.target
        setWeeklyForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const selectedWeekLogs = useMemo(() => {
        if (!weeklyForm.weekStart) return []
        const weekEnd = addDays(weeklyForm.weekStart, 6)

        return dailyLogs.filter((log) => {
            if (!log.date) return false
            return log.date >= weeklyForm.weekStart && log.date <= weekEnd
        })
    }, [dailyLogs, weeklyForm.weekStart])

    const weeklySummary = useMemo(() => {
        const workoutsCompleted = selectedWeekLogs.filter(
            (log) => normalizeExerciseName(log.workout_focus) !== 'rest day'
        ).length

        const restDays = selectedWeekLogs.filter(
            (log) => normalizeExerciseName(log.workout_focus) === 'rest day'
        ).length

        const cardioSessions = selectedWeekLogs.filter(
            (log) => Number(log.cardio_duration || 0) > 0
        ).length

        const cardioMinutes = selectedWeekLogs.reduce(
            (total, log) => total + Number(log.cardio_duration || 0),
            0
        )

        const totalVolumeLifted = selectedWeekLogs.reduce((total, log) => {
            const exercise1Volume = Number(log.exercise1_weight || 0) * Number(log.exercise1_reps || 0)
            const exercise2Volume = Number(log.exercise2_weight || 0) * Number(log.exercise2_reps || 0)
            return total + exercise1Volume + exercise2Volume
        }, 0)

        return {
            workoutsCompleted,
            restDays,
            cardioSessions,
            cardioMinutes,
            totalVolumeLifted
        }
    }, [selectedWeekLogs])

    const strengthTrends = useMemo(() => {
        const exerciseMap = new Map()

        selectedWeekLogs.forEach((log) => {
            const candidates = [
                {
                    name: log.exercise1,
                    weight: log.exercise1_weight,
                    reps: log.exercise1_reps,
                    date: log.date
                },
                {
                    name: log.exercise2,
                    weight: log.exercise2_weight,
                    reps: log.exercise2_reps,
                    date: log.date
                }
            ]

            candidates.forEach((entry) => {
                const normalizedName = normalizeExerciseName(entry.name)
                const numericWeight = Number(entry.weight || 0)
                const numericReps = Number(entry.reps || 0)

                if (
                    !normalizedName ||
                    normalizedName === 'n/a' ||
                    normalizedName === 'rest day' ||
                    numericWeight <= 0
                ) {
                    return
                }

                if (!exerciseMap.has(normalizedName)) {
                    exerciseMap.set(normalizedName, {
                        key: normalizedName,
                        label: entry.name,
                        entries: []
                    })
                }

                exerciseMap.get(normalizedName).entries.push({
                    exercise: entry.name,
                    weight: numericWeight,
                    reps: numericReps,
                    date: entry.date
                })
            })
        })

        return Array.from(exerciseMap.values())
            .map((trend) => ({
                ...trend,
                bestWeight: Math.max(...trend.entries.map((entry) => entry.weight)),
                totalSetsLogged: trend.entries.length
            }))
            .sort((a, b) => b.bestWeight - a.bestWeight)
    }, [selectedWeekLogs])

    const previousWeeklyLog = useMemo(() => {
        if (!weeklyForm.weekStart) return null

        const earlierLogs = weeklyLogs
            .filter((log) => log.week_start && log.week_start < weeklyForm.weekStart)
            .sort((a, b) => new Date(b.week_start) - new Date(a.week_start))

        return earlierLogs[0] || null
    }, [weeklyLogs, weeklyForm.weekStart])

    const weightChange = useMemo(() => {
        if (!weeklyForm.weight || !previousWeeklyLog?.weight) return null
        return Number(weeklyForm.weight) - Number(previousWeeklyLog.weight)
    }, [weeklyForm.weight, previousWeeklyLog])

    const waistChange = useMemo(() => {
        if (!weeklyForm.waist || !previousWeeklyLog?.waist) return null
        return Number(weeklyForm.waist) - Number(previousWeeklyLog.waist)
    }, [weeklyForm.waist, previousWeeklyLog])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!profile?.id) {
            alert('No profile found for this account.')
            return
        }

        const newLog = {
            profile_id: profile.id,
            user_id: profile.id,
            week_start: weeklyForm.weekStart || null,
            workouts_completed: weeklySummary.workoutsCompleted,
            cardio_sessions: weeklySummary.cardioSessions,
            weight: weeklyForm.weight ? Number(weeklyForm.weight) : null,
            waist: weeklyForm.waist ? Number(weeklyForm.waist) : null,
            biggest_win: weeklyForm.biggestWin,
            biggest_challenge: weeklyForm.biggestChallenge,
            recovery_rating: weeklyForm.recoveryRating ? Number(weeklyForm.recoveryRating) : null,
            next_week_focus: weeklyForm.nextWeekFocus,
            notes: weeklyForm.notes
        }

        const { error } = await supabase.from('weekly_logs').insert([newLog])

        if (error) {
            console.error('Error saving weekly log:', error)
            alert('Failed to save weekly log')
            return
        }

        alert('Weekly log saved')

        const { data: refreshedWeeklyLogs, error: refreshedWeeklyError } = await supabase
            .from('weekly_logs')
            .select('*')
            .eq('profile_id', profile.id)
            .order('week_start', { ascending: true })

        if (refreshedWeeklyError) {
            console.error('Error refreshing weekly logs:', refreshedWeeklyError)
        } else {
            setWeeklyLogs(refreshedWeeklyLogs || [])
        }

        setWeeklyForm({
            weekStart: weeklyForm.weekStart,
            weight: '',
            waist: '',
            biggestWin: '',
            biggestChallenge: '',
            recoveryRating: '',
            nextWeekFocus: '',
            notes: ''
        })
    }

    return (
        <div className="page-container">
            <h2>Weekly Progress</h2>
            <p className="form-helper-text">
                Review the week automatically from your daily logs, then save your body metrics and weekly reflection.
            </p>

            <form onSubmit={handleSubmit} className="form-card">
                <div className="form-section">
                    <h3 className="form-section-title">Week Overview</h3>

                    <label className="form-label">Week Starting</label>
                    <input
                        type="date"
                        name="weekStart"
                        value={weeklyForm.weekStart}
                        onChange={handleChange}
                        className="form-input"
                    />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Weekly Dashboard</h3>

                    {loadingSummary ? (
                        <p className="form-helper-text">Loading weekly summary...</p>
                    ) : (
                        <>
                            <p><strong>Workouts Completed:</strong> {weeklySummary.workoutsCompleted}</p>
                            <p><strong>Rest Days:</strong> {weeklySummary.restDays}</p>
                            <p><strong>Cardio Sessions:</strong> {weeklySummary.cardioSessions}</p>
                            <p><strong>Total Cardio Time:</strong> {weeklySummary.cardioMinutes} minutes</p>
                            <p><strong>Total Volume Lifted:</strong> {weeklySummary.totalVolumeLifted} lbs</p>
                        </>
                    )}
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Strength Trends</h3>

                    {loadingSummary ? (
                        <p className="form-helper-text">Loading strength trends...</p>
                    ) : strengthTrends.length === 0 ? (
                        <p className="form-helper-text">
                            No strength exercises were logged for this week.
                        </p>
                    ) : (
                        strengthTrends.map((trend) => (
                            <div key={trend.key} className="history-card">
                                <h4 className="history-card-title">{trend.label}</h4>
                                <p><strong>Best Logged Weight:</strong> {trend.bestWeight} lbs</p>
                                <p><strong>Entries Logged:</strong> {trend.totalSetsLogged}</p>
                            </div>
                        ))
                    )}
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Body Metrics</h3>

                    <label className="form-label">Weight</label>
                    <input
                        type="number"
                        name="weight"
                        value={weeklyForm.weight}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Body weight"
                    />

                    {weightChange != null && (
                        <p className="form-helper-text">
                            Weight change from last week: {weightChange > 0 ? '+' : ''}{weightChange}
                        </p>
                    )}

                    <label className="form-label">Waist Measurement</label>
                    <input
                        type="number"
                        name="waist"
                        value={weeklyForm.waist}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Waist measurement"
                    />

                    {waistChange != null && (
                        <p className="form-helper-text">
                            Waist change from last week: {waistChange > 0 ? '+' : ''}{waistChange}
                        </p>
                    )}
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Weekly Reflection</h3>

                    <label className="form-label">Biggest Win This Week</label>
                    <input
                        type="text"
                        name="biggestWin"
                        value={weeklyForm.biggestWin}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="PR, consistency, improved run time, etc."
                    />

                    <label className="form-label">Biggest Challenge</label>
                    <input
                        type="text"
                        name="biggestChallenge"
                        value={weeklyForm.biggestChallenge}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Recovery, schedule, fatigue, etc."
                    />

                    <label className="form-label">Recovery / Energy (1–10)</label>
                    <input
                        type="number"
                        name="recoveryRating"
                        value={weeklyForm.recoveryRating}
                        onChange={handleChange}
                        className="form-input"
                        min="1"
                        max="10"
                        placeholder="1 = exhausted, 10 = fully recovered"
                    />

                    <label className="form-label">Focus for Next Week</label>
                    <input
                        type="text"
                        name="nextWeekFocus"
                        value={weeklyForm.nextWeekFocus}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Strength, endurance, recovery, etc."
                    />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Notes</h3>

                    <label className="form-label">Weekly Notes</label>
                    <textarea
                        name="notes"
                        value={weeklyForm.notes}
                        onChange={handleChange}
                        className="form-textarea"
                        rows={4}
                        placeholder="Overall notes for the week"
                    />
                </div>

                <button type="submit" className="form-button">Save Weekly Progress</button>
            </form>
        </div>
    )
}

export default WeeklyLogForm