import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function TeamDashboard({ profile }) {
    const [profiles, setProfiles] = useState([])
    const [dailyLogs, setDailyLogs] = useState([])
    const [weeklyLogs, setWeeklyLogs] = useState([])
    const [monthlyLogs, setMonthlyLogs] = useState([])
    const [profileEmails, setProfileEmails] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingRoleId, setSavingRoleId] = useState(null)
    const [statusMessage, setStatusMessage] = useState('')
    const [deletingMemberId, setDeletingMemberId] = useState(null)

    const loadTeamData = async () => {
        if (profile?.role !== 'admin') {
            setLoading(false)
            return
        }

        const [
            { data: profilesData, error: profilesError },
            { data: dailyData, error: dailyError },
            { data: weeklyData, error: weeklyError },
            { data: monthlyData, error: monthlyError },
            { data: profileEmailsData, error: profileEmailsError }
        ] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('daily_logs').select('*').order('created_at', { ascending: false }),
            supabase.from('weekly_logs').select('*').order('created_at', { ascending: false }),
            supabase.from('monthly_logs').select('*').order('created_at', { ascending: false }),
            supabase.from('profile_emails').select('*').order('created_at', { ascending: true })
        ])

        if (profilesError) console.error('Error loading profiles:', profilesError)
        if (dailyError) console.error('Error loading daily logs:', dailyError)
        if (weeklyError) console.error('Error loading weekly logs:', weeklyError)
        if (monthlyError) console.error('Error loading monthly logs:', monthlyError)
        if (profileEmailsError) console.error('Error loading profile emails:', profileEmailsError)

        setProfiles(profilesData || [])
        setDailyLogs(dailyData || [])
        setWeeklyLogs(weeklyData || [])
        setMonthlyLogs(monthlyData || [])
        setProfileEmails(profileEmailsData || [])
        setLoading(false)
    }

    useEffect(() => {
        loadTeamData()
        // eslint-disable-next-line
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

    const handleDeleteMember = async (member) => {
        const confirmed = window.confirm(
            `Delete ${member.full_name || member.email || 'this member'} from the app? This will remove their profile, aliases, and logs.`
        )

        if (!confirmed) return

        setDeletingMemberId(member.id)
        setStatusMessage('')

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', member.id)

        if (error) {
            console.error('Error deleting member:', error)
            setStatusMessage(`Failed to delete ${member.full_name || member.email}.`)
            setDeletingMemberId(null)
            return
        }

        setStatusMessage(`Deleted ${member.full_name || member.email} from the app.`)
        setDeletingMemberId(null)
        await loadTeamData()
    }

    const groupMembers = useMemo(() => {
        if (!profile?.team_name) return []

        return profiles.filter((member) => member.team_name === profile.team_name)
    }, [profiles, profile])

    const stats = useMemo(() => {
        const totalMembers = groupMembers.length
        const groupMemberIds = new Set(groupMembers.map((member) => member.id))

        const today = new Date()
        const todayKey = today.toLocaleDateString('en-CA')

        const weekStart = new Date(today)
        const dayOfWeek = weekStart.getDay()
        const daysSinceMonday = (dayOfWeek + 6) % 7
        weekStart.setDate(weekStart.getDate() - daysSinceMonday)
        const weekStartKey = weekStart.toLocaleDateString('en-CA')

        const currentMonthName = today.toLocaleString('en-US', { month: 'long' })

        const submittedDailyToday = new Set(
            dailyLogs
                .filter((log) => log.date === todayKey && groupMemberIds.has(log.user_id))
                .map((log) => log.user_id)
        )

        const submittedWeeklyThisWeek = new Set(
            weeklyLogs
                .filter((log) => log.week_start === weekStartKey && groupMemberIds.has(log.user_id))
                .map((log) => log.user_id)
        )

        const submittedMonthlyThisMonth = new Set(
            monthlyLogs
                .filter((log) => log.month === currentMonthName && groupMemberIds.has(log.user_id))
                .map((log) => log.user_id)
        )

        const missingDaily = groupMembers.filter((member) => !submittedDailyToday.has(member.id))
        const missingWeekly = groupMembers.filter((member) => !submittedWeeklyThisWeek.has(member.id))
        const missingMonthly = groupMembers.filter((member) => !submittedMonthlyThisMonth.has(member.id))

        const memberStatuses = groupMembers.map((member) => ({
            id: member.id,
            name: member.full_name || member.email || 'Unknown member',
            email: member.email || '—',
            role: member.role || 'member',
            aliases: profileEmails.filter(
                (alias) => alias.profile_id === member.id && !alias.is_primary
            ),
            dailySubmitted: submittedDailyToday.has(member.id),
            weeklySubmitted: submittedWeeklyThisWeek.has(member.id),
            monthlySubmitted: submittedMonthlyThisMonth.has(member.id)
        }))

        const recentActivity = [
            ...dailyLogs
                .filter((log) => groupMemberIds.has(log.user_id))
                .map((log) => ({
                    type: 'Daily',
                    created_at: log.created_at,
                    user_id: log.user_id,
                    summary: log.workout_focus || 'Daily workout'
                })),
            ...weeklyLogs
                .filter((log) => groupMemberIds.has(log.user_id))
                .map((log) => ({
                    type: 'Weekly',
                    created_at: log.created_at,
                    user_id: log.user_id,
                    summary: log.week_start ? `Week of ${log.week_start}` : 'Weekly log'
                })),
            ...monthlyLogs
                .filter((log) => groupMemberIds.has(log.user_id))
                .map((log) => ({
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
            dailySubmissionCount: submittedDailyToday.size,
            weeklySubmissionCount: submittedWeeklyThisWeek.size,
            monthlySubmissionCount: submittedMonthlyThisMonth.size,
            missingDaily,
            missingWeekly,
            missingMonthly,
            memberStatuses,
            recentActivity
        }
    }, [groupMembers, dailyLogs, weeklyLogs, monthlyLogs, profileEmails])

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
                View group activity, submissions, overall progress, and manage admin access.
            </p>

            {statusMessage && <p className="form-helper-text">{statusMessage}</p>}

            <div className="quick-actions">
                <div className="quick-action-card">
                    <h3>Total Members</h3>
                    <p className="stat-value">{stats.totalMembers}</p>
                </div>

                <div className="quick-action-card">
                    <h3>Daily Submissions</h3>
                    <p className="stat-value">{stats.dailySubmissionCount}</p>
                </div>

                <div className="quick-action-card">
                    <h3>Weekly Submissions</h3>
                    <p className="stat-value">{stats.weeklySubmissionCount}</p>
                </div>

                <div className="quick-action-card">
                    <h3>Monthly Submissions</h3>
                    <p className="stat-value">{stats.monthlySubmissionCount}</p>
                </div>
            </div>

            <div className="history-section">
                <h3 className="history-title">Role Management</h3>
                <p className="history-section-subtitle">
                    Edit roles for every member in your group.
                </p>

                {groupMembers.length === 0 ? (
                    <p className="history-empty">No members found in your group.</p>
                ) : (
                    <div className="history-grid">
                        {groupMembers.map((member) => (
                            <div key={member.id} className="history-card">
                                <div className="history-card-header">
                                    <div>
                                        <h4 className="history-card-title">{member.full_name || 'Unnamed member'}</h4>
                                        <p className="history-card-meta"><strong>Email:</strong> {member.email || '—'}</p>
                                    </div>
                                </div>

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

                                <div className="history-card-header">
                                    <button
                                        type="button"
                                        className="form-button"
                                        onClick={() => handleSaveRole(member)}
                                        disabled={savingRoleId === member.id || deletingMemberId === member.id}
                                    >
                                        {savingRoleId === member.id ? 'Saving...' : 'Save Role'}
                                    </button>

                                    <button
                                        type="button"
                                        className="delete-button"
                                        onClick={() => handleDeleteMember(member)}
                                        disabled={deletingMemberId === member.id || savingRoleId === member.id}
                                    >
                                        {deletingMemberId === member.id ? 'Deleting...' : 'Delete Member'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="history-section">
                <h3 className="history-title">Submission Status</h3>
                <p className="history-section-subtitle">
                    Quickly review which members in your group have submitted their daily, weekly, and monthly logs for the current period.
                </p>

                {stats.memberStatuses.length === 0 ? (
                    <p className="history-empty">No members found in your group.</p>
                ) : (
                    stats.memberStatuses.map((member) => (
                        <div key={`status-${member.id}`} className="history-card">
                            <div className="history-card-header">
                                <div>
                                    <h4 className="history-card-title">{member.name}</h4>
                                    <p className="history-card-meta"><strong>Email:</strong> {member.email}</p>
                                    <p className="history-card-meta"><strong>Role:</strong> {member.role}</p>
                                </div>
                            </div>

                            <div className="history-grid">
                                <div>
                                    <p className="history-field"><strong>Daily:</strong> {member.dailySubmitted ? '✓ Submitted' : '✗ Missing'}</p>
                                    <p className="history-field"><strong>Weekly:</strong> {member.weeklySubmitted ? '✓ Submitted' : '✗ Missing'}</p>
                                    <p className="history-field"><strong>Monthly:</strong> {member.monthlySubmitted ? '✓ Submitted' : '✗ Missing'}</p>
                                </div>

                                <div>
                                    <p className="history-field"><strong>Alias Emails:</strong></p>
                                    {member.aliases.length === 0 ? (
                                        <p className="history-field">No aliases</p>
                                    ) : (
                                        member.aliases.map((alias) => (
                                            <p key={alias.id} className="history-field">{alias.email}</p>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
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
                <p className="history-section-subtitle">
                    Shows members in your group who have not submitted a daily log today, a weekly log for the current week, or a monthly log for the current month.
                </p>

                <div className="history-card">
                    <div className="history-grid">
                        <div>
                            <p><strong>Missing Daily Today</strong></p>
                            {stats.missingDaily.length === 0 ? (
                                <p>None</p>
                            ) : (
                                stats.missingDaily.map((member) => (
                                    <p key={`daily-${member.id}`}>{member.full_name || member.email}</p>
                                ))
                            )}
                        </div>

                        <div>
                            <p><strong>Missing Weekly This Week</strong></p>
                            {stats.missingWeekly.length === 0 ? (
                                <p>None</p>
                            ) : (
                                stats.missingWeekly.map((member) => (
                                    <p key={`weekly-${member.id}`}>{member.full_name || member.email}</p>
                                ))
                            )}
                        </div>

                        <div>
                            <p><strong>Missing Monthly This Month</strong></p>
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