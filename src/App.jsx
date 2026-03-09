import { useEffect, useState } from 'react'
import './App.css'
import DailyLogForm from './components/DailyLogForm'
import WeeklyLogForm from './components/WeeklyLogForm'
import MonthlyLogForm from './components/MonthlyLogForm'
import History from './components/History'
import Auth from './components/Auth'
import { supabase } from './lib/supabase'

function App() {
  const [page, setPage] = useState('home')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const [session, setSession] = useState(null)

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Auth />
  }

  const renderPage = () => {
    if (page === 'daily') {
      return <DailyLogForm />
    }

    if (page === 'weekly') {
      return <WeeklyLogForm />
    }

    if (page === 'monthly') {
      return <MonthlyLogForm />
    }

    if (page === 'history') {
      return <History />
    }

    return (
      <div className="home-hero">
        <h1>Fitness Tracker</h1>
        <p>
          Track daily workouts, weekly training, and monthly progress in one place.
          Use the navigation above to log workouts and review your training history.
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
          onClick={async () => {
            await supabase.auth.signOut()
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
