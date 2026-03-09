import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Profile({ profile }) {
    const [dailyLogs, setDailyLogs] = useState([])
    const [weeklyLogs, setWeeklyLogs] = useState([])
    const [monthlyLogs, setMonthlyLogs] = useState([])
    const [loading, setLoading] = useState(false)

    const [aliases, setAliases] = useState([])
    const [newAliasEmail, setNewAliasEmail] = useState('')
    const [loadingAliases, setLoadingAliases] = useState(true)
    const [savingAlias, setSavingAlias] = useState(false)
    const [aliasMessage, setAliasMessage] = useState('')

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

    const handleSaveProfile = async () => {
        // existing save profile logic
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

    return (
        <div className="page-container">
            <h2>Profile Information</h2>
            <form className="form-card">
                {/* existing profile form inputs */}
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

            <h2>Progress Summary</h2>
            {/* existing progress summary JSX */}
        </div>
    )
}

export default Profile