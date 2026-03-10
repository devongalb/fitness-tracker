import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import DailyLogForm from './components/DailyLogForm'
import WeeklyLogForm from './components/WeeklyLogForm'
import MonthlyLogForm from './components/MonthlyLogForm'
import History from './components/History'
import Profile from './components/Profile'
import TeamDashboard from './components/TeamDashboard'

function App() {
  const [page, setPage] = useState('home')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
const loadProfile = async (currentSession) => {
  if (!currentSession?.user?.email || !currentSession?.user?.id) {
    setProfile(null)
    return
  }

  const signedInEmail = currentSession.user.email.toLowerCase()
  const authUserId = currentSession.user.id
  console.log('SESSION USER:', currentSession.user)
console.log('SIGNED IN EMAIL:', signedInEmail)
console.log('AUTH USER ID:', authUserId)

const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', authUserId)
  .maybeSingle()

console.log('AUTH USER ID:', authUserId)
console.log('PROFILE DATA:', profileData)
console.log('PROFILE ERROR:', profileError)

  if (profileError) {
    console.error('Error loading profile:', profileError)
    setProfile(null)
    return
  }

  if (!profileData) {
    console.error('No profile row found for auth user.')
    setProfile(null)
    return
  }

  if (profileData.email !== signedInEmail) {
    const { error: updateProfileEmailError } = await supabase
      .from('profiles')
      .update({ email: signedInEmail })
      .eq('id', authUserId)

    if (updateProfileEmailError) {
      console.error('Error syncing profile email:', updateProfileEmailError)
    }
  }

  const { data: aliasRow, error: aliasError } = await supabase
    .from('profile_emails')
    .select('id')
    .eq('email', signedInEmail)
    .maybeSingle()

  if (aliasError) {
    console.error('Error loading profile alias:', aliasError)
  }

  if (!aliasRow) {
    const { error: insertPrimaryAliasError } = await supabase
      .from('profile_emails')
      .upsert(
        {
          profile_id: authUserId,
          email: signedInEmail,
          is_primary: true
        },
        { onConflict: 'email' }
      )

    if (insertPrimaryAliasError) {
      console.error('Error inserting primary alias:', insertPrimaryAliasError)
    }
  }

console.log('SETTING PROFILE:', {
  ...profileData,
  email: signedInEmail
})

  setProfile({
    ...profileData,
    email: signedInEmail
  })
}

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      await loadProfile(session)
      setAuthLoading(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      await loadProfile(session)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) {
    return (
      <div className="page-container">
        <div className="form-card">
          <p className="form-helper-text">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  if (session && !authLoading && !profile) {
  return (
    <div className="page-container">
      <div className="form-card">
        <h2>Profile Load Error</h2>
        <p className="form-helper-text">
          Your session loaded, but your profile could not be retrieved from Supabase.
        </p>
      </div>
    </div>
  )
}

  const renderPage = () => {
    const needsGroupSelection = session && profile && !profile.team_name

    if (needsGroupSelection && page !== 'profile') {
      return (
        <Profile
          profile={profile}
          onProfileUpdate={(updatedProfile) => setProfile(updatedProfile)}
          requireGroupSelection={true}
        />
      )
    }

    if (page === 'daily') return <DailyLogForm profile={profile} />
    if (page === 'weekly') return <WeeklyLogForm profile={profile} />
    if (page === 'monthly') return <MonthlyLogForm profile={profile} />
    if (page === 'history') return <History profile={profile} />

    if (page === 'profile') {
      return (
        <Profile
          profile={profile}
          onProfileUpdate={(updatedProfile) => setProfile(updatedProfile)}
          requireGroupSelection={session && profile && !profile.team_name}
        />
      )
    }

    if (page === 'team') return <TeamDashboard profile={profile} />

    return (
      <div className="home-hero">
        <h1>
          Fitness Tracker{profile?.team_name ? `: ${profile.team_name}` : ''}
        </h1>
        <p>
          Track daily workouts, weekly training, and monthly progress in one place.
        </p>

        <div className="quick-actions">
          {session && profile && !profile.team_name && (
            <div className="quick-action-card" onClick={() => setPage('profile')}>
              <h3>Choose Your Group</h3>
              <p>Select your group in My Profile before using the tracker.</p>
            </div>
          )}

          <div className="quick-action-card" onClick={() => setPage('daily')}>
            <h3>Daily Log</h3>
            <p>Record exercises, cardio sessions, and workout notes.</p>
          </div>

          <div className="quick-action-card" onClick={() => setPage('weekly')}>
            <h3>Weekly Log</h3>
            <p>Track workouts completed throughout the week.</p>
          </div>

          <div className="quick-action-card" onClick={() => setPage('monthly')}>
            <h3>Monthly Progress</h3>
            <p>Monitor weight, measurements, and strength progress.</p>
          </div>

          <div className="quick-action-card" onClick={() => setPage('history')}>
            <h3>History</h3>
            <p>Review saved workout logs and training history.</p>
          </div>

          <div className="quick-action-card" onClick={() => setPage('profile')}>
            <h3>My Profile</h3>
            <p>View your profile, latest logs, and progress summary.</p>
          </div>

          {profile?.role === 'admin' && (
            <div className="quick-action-card" onClick={() => setPage('team')}>
              <h3>Team Dashboard</h3>
              <p>Review team members, submissions, and admin controls.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="mobile-topbar">
        <button
          type="button"
          className={page === 'home' ? 'nav-button nav-button-active' : 'nav-button'}
          onClick={() => setPage('home')}
        >
          Home
        </button>
      </div>

      <div className="top-nav desktop-nav">
        {session && profile && !profile.team_name ? (
          <button
            onClick={() => setPage('profile')}
            className={page === 'profile' ? 'nav-button nav-button-active' : 'nav-button'}
          >
            My Profile
          </button>
        ) : (
          <>
            <button
              onClick={() => setPage('home')}
              className={page === 'home' ? 'nav-button nav-button-active' : 'nav-button'}
            >
              Home
            </button>

            <button
              onClick={() => setPage('daily')}
              className={page === 'daily' ? 'nav-button nav-button-active' : 'nav-button'}
            >
              Daily Log
            </button>

            <button
              onClick={() => setPage('weekly')}
              className={page === 'weekly' ? 'nav-button nav-button-active' : 'nav-button'}
            >
              Weekly Log
            </button>

            <button
              onClick={() => setPage('monthly')}
              className={page === 'monthly' ? 'nav-button nav-button-active' : 'nav-button'}
            >
              Monthly Progress
            </button>

            <button
              onClick={() => setPage('history')}
              className={page === 'history' ? 'nav-button nav-button-active' : 'nav-button'}
            >
              History
            </button>

            <button
              onClick={() => setPage('profile')}
              className={page === 'profile' ? 'nav-button nav-button-active' : 'nav-button'}
            >
              My Profile
            </button>

            {profile?.role === 'admin' && (
              <button
                onClick={() => setPage('team')}
                className={page === 'team' ? 'nav-button nav-button-active' : 'nav-button'}
              >
                Team Dashboard
              </button>
            )}
          </>
        )}

        <button
          onClick={async () => {
            await supabase.auth.signOut()
            setProfile(null)
            setPage('home')
          }}
          className="nav-button"
        >
          Sign Out
        </button>

        <select
          className="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          aria-label="Theme selector"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <main className="app-main">{renderPage()}</main>
    </div>
  )
}

export default App