import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Profile({ profile }) {
    const [dailyLogs, setDailyLogs] = useState([])
    const [weeklyLogs, setWeeklyLogs] = useState([])
    const [monthlyLogs, setMonthlyLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadProfileData = async () => {
            const {
                data: { user }
            } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            const { data: dailyData } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3)

            const { data: weeklyData } = await supabase
                .from('weekly_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3)

            const { data: monthlyData } = await supabase
                .from('monthly_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3)

            setDailyLogs(dailyData || [])
            setWeeklyLogs(weeklyData || [])
            setMonthlyLogs(monthlyData || [])
            setLoading(false)
        }

        loadProfileData()
    }, [])

    const latestDaily = dailyLogs[0]
    const latestWeekly = weeklyLogs[0]
    const latestMonthly = monthlyLogs[0]

    return (
        <div className="page-container">
            <h2>My Profile</h2>
            <p className="form-helper-text">
                View your profile details, latest activity, and progress summary.
            </p>

            <div className="form-card">
                <div className="form-section">
                    <h3 className="form-section-title">Profile Information</h3>

                    <p><strong>Name:</strong> {profile?.full_name || 'Not set yet'}</p>
                    <p><strong>Email:</strong> {profile?.email || 'Not available'}</p>
                    <p><strong>Team:</strong> {profile?.team_name || 'Not set yet'}</p>
                    <p><strong>Role:</strong> {profile?.role || 'member'}</p>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Progress Summary</h3>

                    {loading ? (
                        <p>Loading profile summary...</p>
                    ) : (
                        <>
                            <p><strong>Total Daily Logs:</strong> {dailyLogs.length}</p>
                            <p><strong>Total Weekly Logs:</strong> {weeklyLogs.length}</p>
                            <p><strong>Total Monthly Logs:</strong> {monthlyLogs.length}</p>
                            <p>
                                <strong>Latest Submission:</strong>{' '}
                                {latestDaily?.created_at ||
                                    latestWeekly?.created_at ||
                                    latestMonthly?.created_at
                                    ? new Date(
                                        latestDaily?.created_at ||
                                        latestWeekly?.created_at ||
                                        latestMonthly?.created_at
                                    ).toLocaleString()
                                    : 'No submissions yet'}
                            </p>
                        </>
                    )}
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Recent Daily Logs</h3>

                    {dailyLogs.length === 0 ? (
                        <p>No daily logs yet.</p>
                    ) : (
                        dailyLogs.map((log) => (
                            <div key={log.id} className="history-card">
                                <p><strong>Date:</strong> {log.date}</p>
                                <p><strong>Focus:</strong> {log.workout_focus}</p>
                                <p><strong>Cardio:</strong> {log.cardio_type} ({log.cardio_duration} min)</p>
                            </div>
                        ))
                    )}
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Recent Weekly Logs</h3>

                    {weeklyLogs.length === 0 ? (
                        <p>No weekly logs yet.</p>
                    ) : (
                        weeklyLogs.map((log) => (
                            <div key={log.id} className="history-card">
                                <p><strong>Week Starting:</strong> {log.week_start}</p>
                                <p><strong>Monday:</strong> {log.monday || '—'}</p>
                                <p><strong>Friday:</strong> {log.friday || '—'}</p>
                            </div>
                        ))
                    )}
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Recent Monthly Logs</h3>

                    {monthlyLogs.length === 0 ? (
                        <p>No monthly logs yet.</p>
                    ) : (
                        monthlyLogs.map((log) => (
                            <div key={log.id} className="history-card">
                                <p><strong>Month:</strong> {log.month}</p>
                                <p><strong>Weight:</strong> {log.weight ?? '—'}</p>
                                <p><strong>Bench:</strong> {log.bench ?? '—'}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Profile