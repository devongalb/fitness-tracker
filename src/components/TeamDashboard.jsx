import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function TeamDashboard({ profile }) {
    const [profiles, setProfiles] = useState([])
    const [dailyLogs, setDailyLogs] = useState([])
    const [weeklyLogs, setWeeklyLogs] = useState([])
    const [monthlyLogs, setMonthlyLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingRoleId, setSavingRoleId] = useState(null)
    const [statusMessage, setStatusMessage] = useState('')

    const loadTeamData = async () => {
        if (profile?.role !== 'admin') {
            setLoading(false)
            return
        }

        const [
            { data: profilesData, error: profilesError },
            { data: dailyData, error: dailyError },
            { data: weeklyData, error: weeklyError },
            { data: monthlyData, error: monthlyError }
        ] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('daily_logs').select('*').order('created_at', { ascending: false }),
            supabase.from('weekly_logs').select('*').order('created_at', { ascending: false }),
            supabase.from('monthly_logs').select('*').order('created_at', { ascending: false })
        ])

        if (profilesError) console.error('Error loading profiles:', profilesError)
        if (dailyError) console.error('Error loading daily logs:', dailyError)
        if (weeklyError) console.error('Error loading weekly logs:', weeklyError)
        if (monthlyError) console.error('Error loading monthly logs:', monthlyError)

        setProfiles(profilesData || [])
        setDailyLogs(dailyData || [])
        setWeeklyLogs(weeklyData || [])
        setMonthlyLogs(monthlyData || [])
        setLoading(false)
    }

    useEffect(() => {
        loadTeamData()
    }, [profile])

    const handleRoleSelection = (id, newRole) => {
        setProfiles((prev) =>
            prev.map((member) =>
                member.id === id ? { ...member, role: newRole } : member
            )
        )
    }

    const handleSaveRole = async (member) => {
        setSavingRoleId(member.id)
        setStatusMessage('')

        const { error } = await supabase
            .from('profiles')
            .update({ role: member.role })
            .eq('id', member.id)

        if (error) {
            console.error('Error updating role:', error)
            setStatusMessage(`Failed to update role for ${member.full_name || member.email}.`)
            setSavingRoleId(null)
            return
        }

        setStatusMessage(`Updated role for ${member.full_name || member.email}.`)
        setSavingRoleId(null)
        await loadTeamData()
    }

    const stats = useMemo(() => {
        const totalMembers = profiles.length

        const latestDailyByUser = new Map()
        dailyLogs.forEach((log) => {
            if (!latestDailyByUser.has(log.user_id)) {
                latestDailyByUser.set(log.user_id, log)
            }
        })

        const latestWeeklyByUser = new Map()
        weeklyLogs.forEach((log) => {
            if (!latestWeeklyByUser.has(log.user_id)) {
                latestWeeklyByUser.set(log.user_id, log)
            }
        })

        const latestMonthlyByUser = new Map()
        monthlyLogs.forEach((log) => {
            if (!latestMonthlyByUser.has(log.user_id)) {
                latestMonthlyByUser.set(log.user_id, log)
            }
        })

        const missingDaily = profiles.filter((member) => !latestDailyByUser.has(member.id))
        const missingWeekly = profiles.filter((member) => !latestWeeklyByUser.has(member.id))
        const missingMonthly = profiles.filter((member) => !latestMonthlyByUser.has(member.id))

        const average = (values) => {
            const valid = values.filter((v) => typeof v === 'number' && !Number.isNaN(v))
            if (valid.length === 0) return null
            return valid.reduce((sum, value) => sum + value, 0) / valid.length
        }

        const avgCardio = average(dailyLogs.map((log) => log.cardio_duration))
        const avgWeight = average(monthlyLogs.map((log) => log.weight))
        const avgBench = average(monthlyLogs.map((log) => log.bench))
        const avgSquat = average(monthlyLogs.map((log) => log.squat))
        const avgDeadlift = average(monthlyLogs.map((log) => log.deadlift))

        const recentActivity = [
            ...dailyLogs.map((log) => ({
                type: 'Daily',
                created_at: log.created_at,
                user_id: log.user_id,
                summary: log.workout_focus || 'Daily workout'
            })),
            ...weeklyLogs.map((log) => ({
                type: 'Weekly',
                created_at: log.created_at,
                user_id: log.user_id,
                summary: log.week_start ? `Week of ${log.week_start}` : 'Weekly log'
            })),
            ...monthlyLogs.map((log) => ({
                type: 'Monthly',
                created_at: log.created_at,
                user_id: log.user_id,
                summary: log.month || 'Monthly progress'
            }))
        ]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 8)

        return {
            totalMembers,
            missingDaily,
            missingWeekly,
            missingMonthly,
            avgCardio,
            avgWeight,
            avgBench,
            avgSquat,
            avgDeadlift,
            recentActivity
        }
    }, [profiles, dailyLogs, weeklyLogs, monthlyLogs])

    const memberNameById = (userId) => {
        const member = profiles.find((p) => p.id === userId)
        return member?.full_name || member?.email || 'Unknown member'
    }

    if (profile?.role !== 'admin') {
        return (
            <div className="page-container">
                <h2>Team Dashboard</h2>
                <div className="form-card">
                    <p className="form-helper-text">You do not have access to this page.</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="form-card">
                    <p className="form-helper-text">Loading team dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <h2>Team Dashboard</h2>
            <p className="form-helper-text">
                View team-wide activity, submissions, overall progress, and manage admin access.
            </p>

            {statusMessage && <p className="form-helper-text">{statusMessage}</p>}

            <div className="quick-actions">
                <div className="quick-action-card">
                    <h3>Total Members</h3>
                    <p>{stats.totalMembers}</p>
                </div>

                <div className="quick-action-card">
                    <h3>Daily Submissions</h3>
                    <p>{dailyLogs.length}</p>
                </div>

                <div className="quick-action-card">
                    <h3>Weekly Submissions</h3>
                    <p>{weeklyLogs.length}</p>
                </div>

                <div className="quick-action-card">
                    <h3>Monthly Submissions</h3>
                    <p>{monthlyLogs.length}</p>
                </div>
            </div>

            <div className="history-section">
                <h3 className="history-title">Role Management</h3>
                <p className="history-section-subtitle">
                    Promote or demote members directly inside the app.
                </p>

                {profiles.length === 0 ? (
                    <p className="history-empty">No team members found.</p>
                ) : (
                    profiles.map((member) => (
                        <div key={member.id} className="history-card">
                            <div className="history-card-header">
                                <div>
                                    <h4 className="history-card-title">{member.full_name || 'Unnamed member'}</h4>
                                    <p className="history-card-meta"><strong>Email:</strong> {member.email || '—'}</p>
                                    <p className="history-card-meta"><strong>Team:</strong> {member.team_name || '—'}</p>
                                </div>
                            </div>

                            <div className="history-grid">
                                <div>
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-input"
                                        value={member.role || 'member'}
                                        onChange={(e) => handleRoleSelection(member.id, e.target.value)}
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="form-button"
                                onClick={() => handleSaveRole(member)}
                                disabled={savingRoleId === member.id}
                            >
                                {savingRoleId === member.id ? 'Saving...' : 'Save Role'}
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="history-section">
                <h3 className="history-title">Team Averages</h3>
                <div className="history-card">
                    <div className="history-grid">
                        <p className="history-field">
                            <strong>Average Cardio Duration:</strong>{' '}
                            {stats.avgCardio ? `${stats.avgCardio.toFixed(1)} min` : '—'}
                        </p>
                        <p className="history-field">
                            <strong>Average Weight:</strong>{' '}
                            {stats.avgWeight ? stats.avgWeight.toFixed(1) : '—'}
                        </p>
                        <p className="history-field">
                            <strong>Average Bench:</strong>{' '}
                            {stats.avgBench ? stats.avgBench.toFixed(1) : '—'}
                        </p>
                        <p className="history-field">
                            <strong>Average Squat:</strong>{' '}
                            {stats.avgSquat ? stats.avgSquat.toFixed(1) : '—'}
                        </p>
                        <p className="history-field">
                            <strong>Average Deadlift:</strong>{' '}
                            {stats.avgDeadlift ? stats.avgDeadlift.toFixed(1) : '—'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="history-section">
                <h3 className="history-title">Recent Activity</h3>
                {stats.recentActivity.length === 0 ? (
                    <p className="history-empty">No recent activity yet.</p>
                ) : (
                    stats.recentActivity.map((item, index) => (
                        <div key={`${item.type}-${item.created_at}-${index}`} className="history-card">
                            <p><strong>Member:</strong> {memberNameById(item.user_id)}</p>
                            <p><strong>Type:</strong> {item.type}</p>
                            <p><strong>Details:</strong> {item.summary}</p>
                            <p><strong>Submitted:</strong> {new Date(item.created_at).toLocaleString()}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="history-section">
                <h3 className="history-title">Members Missing Logs</h3>

                <div className="history-card">
                    <div className="history-grid">
                        <div>
                            <p><strong>Missing Daily</strong></p>
                            {stats.missingDaily.length === 0 ? (
                                <p>None</p>
                            ) : (
                                stats.missingDaily.map((member) => (
                                    <p key={`daily-${member.id}`}>{member.full_name || member.email}</p>
                                ))
                            )}
                        </div>

                        <div>
                            <p><strong>Missing Weekly</strong></p>
                            {stats.missingWeekly.length === 0 ? (
                                <p>None</p>
                            ) : (
                                stats.missingWeekly.map((member) => (
                                    <p key={`weekly-${member.id}`}>{member.full_name || member.email}</p>
                                ))
                            )}
                        </div>

                        <div>
                            <p><strong>Missing Monthly</strong></p>
                            {stats.missingMonthly.length === 0 ? (
                                <p>None</p>
                            ) : (
                                stats.missingMonthly.map((member) => (
                                    <p key={`monthly-${member.id}`}>{member.full_name || member.email}</p>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TeamDashboard