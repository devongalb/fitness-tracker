import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function Profile({ profile, onProfileUpdate }) {
  const [dailyLogs, setDailyLogs] = useState([])
  const [weeklyLogs, setWeeklyLogs] = useState([])
  const [monthlyLogs, setMonthlyLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    height: '',
    weight: '',
  })

  const [aliases, setAliases] = useState([])
  const [newAliasEmail, setNewAliasEmail] = useState('')
  const [loadingAliases, setLoadingAliases] = useState(true)
  const [savingAlias, setSavingAlias] = useState(false)
  const [aliasMessage, setAliasMessage] = useState('')

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        height: profile.height || '',
        weight: profile.weight || '',
      })
    }
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

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    const updates = {
      id: profile.id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      height: formData.height,
      weight: formData.weight,
      updated_at: new Date(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)

    if (error) {
      alert('Failed to update profile')
    } else {
      onProfileUpdate({ ...profile, ...updates })
    }

    setSaving(false)
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
    <div className="form-card">
      <h2>Profile Information</h2>
      <form onSubmit={handleSaveProfile}>
        <label className="form-label">First Name</label>
        <input
          className="form-input"
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleInputChange}
        />

        <label className="form-label">Last Name</label>
        <input
          className="form-input"
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleInputChange}
        />

        <label className="form-label">Height (inches)</label>
        <input
          className="form-input"
          type="number"
          name="height"
          value={formData.height}
          onChange={handleInputChange}
        />

        <label className="form-label">Weight (lbs)</label>
        <input
          className="form-input"
          type="number"
          name="weight"
          value={formData.weight}
          onChange={handleInputChange}
        />

        <button className="form-button" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
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

      <h2>Progress Summary</h2>
      {loading ? (
        <p>Loading progress...</p>
      ) : (
        <>
          <h3>Recent Daily Logs</h3>
          {dailyLogs.length === 0 ? (
            <p>No daily logs found.</p>
          ) : (
            dailyLogs.map((log) => (
              <div key={log.id} className="history-card">
                <p>{log.created_at}: {log.notes}</p>
              </div>
            ))
          )}

          <h3>Recent Weekly Logs</h3>
          {weeklyLogs.length === 0 ? (
            <p>No weekly logs found.</p>
          ) : (
            weeklyLogs.map((log) => (
              <div key={log.id} className="history-card">
                <p>{log.created_at}: {log.notes}</p>
              </div>
            ))
          )}

          <h3>Recent Monthly Logs</h3>
          {monthlyLogs.length === 0 ? (
            <p>No monthly logs found.</p>
          ) : (
            monthlyLogs.map((log) => (
              <div key={log.id} className="history-card">
                <p>{log.created_at}: {log.notes}</p>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}