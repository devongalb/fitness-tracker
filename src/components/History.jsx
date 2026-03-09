import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function History() {
    const [dailyLogs, setDailyLogs] = useState([])
    const [weeklyLogs, setWeeklyLogs] = useState([])
    const [monthlyLogs, setMonthlyLogs] = useState([])

    useEffect(() => {
        loadLogs()
    }, [])

    const loadLogs = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const { data: dailyData, error: dailyError } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        const { data: weeklyData, error: weeklyError } = await supabase
            .from('weekly_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        const { data: monthlyData, error: monthlyError } = await supabase
            .from('monthly_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (dailyError) console.error('Error loading daily logs:', dailyError)
        if (weeklyError) console.error('Error loading weekly logs:', weeklyError)
        if (monthlyError) console.error('Error loading monthly logs:', monthlyError)

        setDailyLogs(dailyData || [])
        setWeeklyLogs(weeklyData || [])
        setMonthlyLogs(monthlyData || [])
    }

    const deleteLog = async (tableName, id) => {
        const confirmed = window.confirm('Delete this log?')
        if (!confirmed) return

        const { error } = await supabase.from(tableName).delete().eq('id', id)

        if (error) {
            console.error('Error deleting log:', error)
            alert('Failed to delete log')
            return
        }

        loadLogs()
    }

    return (
        <div className="page-container">
            <h2>Workout History</h2>

            <div className="history-section">
                <h3 className="history-title">Daily Logs</h3>
                <p className="history-section-subtitle">
                    Your most recent daily workout entries appear first.
                </p>
                {dailyLogs.length === 0 && (
                    <p className="history-empty">No daily logs yet.</p>
                )}
                {dailyLogs.map((log, index) => (
                    <div key={log.id || index} className="history-card">
                        <div className="history-card-header">
                            <div>
                                <h4 className="history-card-title">{log.workout_focus || 'Daily Workout'}</h4>
                                <p className="history-card-meta"><strong>Date:</strong> {log.date}</p>
                                {log.created_at && (
                                    <p className="history-card-meta">
                                        <strong>Entered:</strong> {new Date(log.created_at).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                className="delete-button"
                                onClick={() => deleteLog('daily_logs', log.id)}
                            >
                                Delete
                            </button>
                        </div>

                        <div className="history-grid">
                            <p className="history-field"><strong>Exercise 1:</strong> {log.exercise1} ({log.exercise1_weight} lbs x {log.exercise1_reps})</p>
                            <p className="history-field"><strong>Exercise 2:</strong> {log.exercise2} ({log.exercise2_weight} lbs x {log.exercise2_reps})</p>
                            <p className="history-field"><strong>Cardio:</strong> {log.cardio_type}</p>
                            <p className="history-field"><strong>Duration:</strong> {log.cardio_duration} minutes</p>
                        </div>

                        {log.notes && (
                            <details className="history-notes">
                                <summary>Workout Notes</summary>
                                <p>{log.notes}</p>
                            </details>
                        )}
                    </div>
                ))}
            </div>

            <div className="history-section">
                <h3 className="history-title">Weekly Logs</h3>
                <p className="history-section-subtitle">
                    Review training completed across each week.
                </p>
                {weeklyLogs.length === 0 && (
                    <p className="history-empty">No weekly logs yet.</p>
                )}
                {weeklyLogs.map((log, index) => (
                    <div key={log.id || index} className="history-card">
                        <div className="history-card-header">
                            <div>
                                <h4 className="history-card-title">Week of {log.week_start}</h4>
                                {log.created_at && (
                                    <p className="history-card-meta">
                                        <strong>Entered:</strong> {new Date(log.created_at).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                className="delete-button"
                                onClick={() => deleteLog('weekly_logs', log.id)}
                            >
                                Delete
                            </button>
                        </div>

                        <div className="history-grid">
                            <p className="history-field"><strong>Mon:</strong> {log.monday || '—'}</p>
                            <p className="history-field"><strong>Tue:</strong> {log.tuesday || '—'}</p>
                            <p className="history-field"><strong>Wed:</strong> {log.wednesday || '—'}</p>
                            <p className="history-field"><strong>Thu:</strong> {log.thursday || '—'}</p>
                            <p className="history-field"><strong>Fri:</strong> {log.friday || '—'}</p>
                            <p className="history-field"><strong>Sat:</strong> {log.saturday || '—'}</p>
                        </div>

                        {log.notes && (
                            <details className="history-notes">
                                <summary>Weekly Notes</summary>
                                <p>{log.notes}</p>
                            </details>
                        )}
                    </div>
                ))}
            </div>

            <div className="history-section">
                <h3 className="history-title">Monthly Logs</h3>
                <p className="history-section-subtitle">
                    Track body measurements and strength progress over time.
                </p>
                {monthlyLogs.length === 0 && (
                    <p className="history-empty">No monthly logs yet.</p>
                )}
                {monthlyLogs.map((log, index) => (
                    <div key={log.id || index} className="history-card">
                        <div className="history-card-header">
                            <div>
                                <h4 className="history-card-title">Month: {log.month}</h4>
                                {log.created_at && (
                                    <p className="history-card-meta">
                                        <strong>Entered:</strong> {new Date(log.created_at).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                className="delete-button"
                                onClick={() => deleteLog('monthly_logs', log.id)}
                            >
                                Delete
                            </button>
                        </div>

                        <div className="history-grid">
                            <p className="history-field"><strong>Weight:</strong> {log.weight || '—'}</p>
                            <p className="history-field"><strong>Waist:</strong> {log.waist || '—'}</p>
                            <p className="history-field"><strong>Bench:</strong> {log.bench || '—'}</p>
                            <p className="history-field"><strong>Squat:</strong> {log.squat || '—'}</p>
                            <p className="history-field"><strong>Deadlift:</strong> {log.deadlift || '—'}</p>
                        </div>

                        {log.notes && (
                            <details className="history-notes">
                                <summary>Monthly Notes</summary>
                                <p>{log.notes}</p>
                            </details>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default History