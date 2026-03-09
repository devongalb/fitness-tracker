import { useEffect, useState } from 'react'
import './App.css'
import DailyLogForm from './components/DailyLogForm'
import WeeklyLogForm from './components/WeeklyLogForm'
import MonthlyLogForm from './components/MonthlyLogForm'
import History from './components/History'
import Auth from './components/Auth'
import Profile from './components/Profile'
import TeamDashboard from './components/TeamDashboard'
import { supabase } from './lib/supabase'

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
      if (!currentSession?.user) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        setProfile(null)
        return
      }

      setProfile(data)
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

  const renderPage = () => {
    if (page === 'daily') return <DailyLogForm />
    if (page === 'weekly') return <WeeklyLogForm />
    if (page === 'monthly') return <MonthlyLogForm />
    if (page === 'history') return <History />
    if (page === 'profile') return <Profile profile={profile} />
    if (page === 'team') return <TeamDashboard profile={profile} />

    return (
      <div className="home-hero">
        <h1>Fitness Tracker</h1>
        <p>
          Track daily workouts, weekly training, and monthly progress in one place.
          Use the navigation above to log workouts, review your history, and monitor both personal and team progress.
        </p>

        <div className="quick-actions">
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

        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="top-nav">
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

      {renderPage()}
    </div>
  )
}

export default App