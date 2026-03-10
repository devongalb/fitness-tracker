import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Profile({ profile, onProfileUpdate, requireGroupSelection = false }) {
    const [dailyLogs, setDailyLogs] = useState([])
    const [weeklyLogs, setWeeklyLogs] = useState([])
    const [monthlyLogs, setMonthlyLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [fullName, setFullName] = useState('')
    const [teamName, setTeamName] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')

    const [aliases, setAliases] = useState([])
    const [newAliasEmail, setNewAliasEmail] = useState('')
    const [loadingAliases, setLoadingAliases] = useState(true)
    const [savingAlias, setSavingAlias] = useState(false)
    const [aliasMessage, setAliasMessage] = useState('')

    useEffect(() => {
        setFullName(profile?.full_name || '')
        setTeamName(profile?.team_name || '')
    }, [profile])

    useEffect(() => {
        const loadProfileData = async () => {
            if (!profile?.id) {
                setDailyLogs([])
                setWeeklyLogs([])
                setMonthlyLogs([])
                setAliases([])
                setLoading(false)
                setLoadingAliases(false)
                return
            }

            setLoading(true)
            setLoadingAliases(true)

            const [
                { data: dailyData },
                { data: weeklyData },
                { data: monthlyData },
                { data: aliasData }
            ] = await Promise.all([
                supabase
                    .from('daily_logs')
                    .select('*')
                    .eq('profile_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(3),
                supabase
                    .from('weekly_logs')
                    .select('*')
                    .eq('profile_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(3),
                supabase
                    .from('monthly_logs')
                    .select('*')
                    .eq('profile_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(3),
                supabase
                    .from('profile_emails')
                    .select('*')
                    .eq('profile_id', profile.id)
                    .order('created_at', { ascending: true })
            ])

            setDailyLogs(dailyData || [])
            setWeeklyLogs(weeklyData || [])
            setMonthlyLogs(monthlyData || [])
            setAliases(aliasData || [])
            setLoading(false)
            setLoadingAliases(false)
        }

        loadProfileData()
    }, [profile])

    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        setStatusMessage('')

        if (!teamName) {
            setStatusMessage('Select your group before continuing.')
            setSavingProfile(false)
            return
        }

        if (!profile?.id) {
            setStatusMessage('No profile found for this account.')
            setSavingProfile(false)
            return
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                team_name: teamName
            })
            .eq('id', profile.id)

        if (error) {
            console.error('Error updating profile:', error)
            setStatusMessage('Failed to update profile.')
            setSavingProfile(false)
            return
        }

        setStatusMessage('Profile updated successfully.')
        if (onProfileUpdate) {
            onProfileUpdate({
                ...profile,
                full_name: fullName,
                team_name: teamName
            })
        }
        setSavingProfile(false)
    }

    const handleAddAlias = async (e) => {
        e.preventDefault()
        setAliasMessage('')

        if (!profile?.id) {
            setAliasMessage('No profile found for this account.')
            return
        }

        const normalizedEmail = newAliasEmail.trim().toLowerCase()

        if (!normalizedEmail) {
            setAliasMessage('Enter an email address.')
            return
        }

        if (normalizedEmail === (profile?.email || '').toLowerCase()) {
            setAliasMessage('That email is already your primary email.')
            return
        }

        if (aliases.some((alias) => alias.email?.toLowerCase() === normalizedEmail)) {
            setAliasMessage('That alias already exists on your profile.')
            return
        }

        setSavingAlias(true)

        const { data: existingAlias, error: existingAliasError } = await supabase
            .from('profile_emails')
            .select('id, profile_id, email')
            .eq('email', normalizedEmail)
            .maybeSingle()

        if (existingAliasError) {
            console.error('Error checking existing alias:', existingAliasError)
            setAliasMessage('Failed to validate alias email.')
            setSavingAlias(false)
            return
        }

        if (existingAlias && existingAlias.profile_id !== profile.id) {
            setAliasMessage('That email is already being used by another profile.')
            setSavingAlias(false)
            return
        }

        const { error } = await supabase
            .from('profile_emails')
            .insert({
                profile_id: profile.id,
                email: normalizedEmail,
                is_primary: false
            })

        if (error) {
            console.error('Error adding alias:', error)
            setAliasMessage('Failed to add alias email.')
            setSavingAlias(false)
            return
        }

        const { data: aliasData } = await supabase
            .from('profile_emails')
            .select('*')
            .eq('profile_id', profile.id)
            .order('created_at', { ascending: true })

        setAliases(aliasData || [])
        setNewAliasEmail('')
        setAliasMessage('Alias email added successfully.')
        setSavingAlias(false)
    }

    const latestDaily = dailyLogs[0]
    const latestWeekly = weeklyLogs[0]
    const latestMonthly = monthlyLogs[0]

    return (
        <div className="page-container">
            <h2>My Profile</h2>

            {requireGroupSelection && (
                <p className="form-helper-text">Choose your group to finish setting up your account.</p>
            )}

            <p className="form-helper-text">
                View your profile details, latest activity, and progress summary.
            </p>

            {statusMessage && <p className="form-helper-text">{statusMessage}</p>}

            <div className="form-card">
                <form onSubmit={handleSaveProfile} className="form-section">
                    <h3 className="form-section-title">Profile Information</h3>

                    <label className="form-label">Full Name</label>
                    <input
                        className="form-input"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                    />

                    <label className="form-label">Email</label>
                    <input
                        className="form-input"
                        type="text"
                        value={profile?.email || ''}
                        readOnly
                    />

                    <label className="form-label">Group</label>
                    <select
                        className="form-input"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        required
                    >
                        <option value="">Select a group</option>
                        <option value="452 AMW/CP">452 AMW/CP</option>
                    </select>

                    {requireGroupSelection && !teamName && (
                        <p className="form-helper-text">Select a group to continue using the tracker.</p>
                    )}

                    <button className="form-button" type="submit" disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>

                <div className="form-section">
                    <h3 className="form-section-title">Email Aliases</h3>
                    <p className="form-helper-text">
                        Add additional email addresses that should sign in to this same profile.
                    </p>

                    <p><strong>Primary Email:</strong> {profile?.email || 'Not available'}</p>

                    {aliasMessage && <p className="form-helper-text">{aliasMessage}</p>}

                    {loadingAliases ? (
                        <p>Loading email aliases...</p>
                    ) : aliases.length === 0 ? (
                        <p>No additional email aliases yet.</p>
                    ) : (
                        aliases
                            .filter((alias) => !alias.is_primary)
                            .map((alias) => (
                                <div key={alias.id} className="history-card">
                                    <p><strong>Alias:</strong> {alias.email}</p>
                                </div>
                            ))
                    )}

                    <form onSubmit={handleAddAlias}>
                        <label className="form-label">Add Alias Email</label>
                        <input
                            className="form-input"
                            type="email"
                            value={newAliasEmail}
                            onChange={(e) => setNewAliasEmail(e.target.value)}
                            placeholder="Enter another email address"
                        />

                        <button className="form-button" type="submit" disabled={savingAlias}>
                            {savingAlias ? 'Adding...' : 'Add Alias'}
                        </button>
                    </form>
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
                                {latestDaily?.created_at || latestWeekly?.created_at || latestMonthly?.created_at
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