import { useEffect, useState } from 'react'

function History() {
  const [dailyLogs, setDailyLogs] = useState([])
  const [weeklyLogs, setWeeklyLogs] = useState([])
  const [monthlyLogs, setMonthlyLogs] = useState([])

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = () => {
    const storedDaily = JSON.parse(localStorage.getItem('dailyLogs')) || []
    const storedWeekly = JSON.parse(localStorage.getItem('weeklyLogs')) || []
    const storedMonthly = JSON.parse(localStorage.getItem('monthlyLogs')) || []

    const sortNewestFirst = (logs) =>
      [...logs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    setDailyLogs(sortNewestFirst(storedDaily))
    setWeeklyLogs(sortNewestFirst(storedWeekly))
    setMonthlyLogs(sortNewestFirst(storedMonthly))
  }

  const deleteLog = (storageKey, createdAt) => {
    const confirmed = window.confirm('Delete this log?')
    if (!confirmed) {
      return
    }

    const existingLogs = JSON.parse(localStorage.getItem(storageKey)) || []
    const updatedLogs = existingLogs.filter((log) => log.createdAt !== createdAt)
    localStorage.setItem(storageKey, JSON.stringify(updatedLogs))
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
          <div key={log.createdAt || index} className="history-card">
            <div className="history-card-header">
              <div>
                <h4 className="history-card-title">{log.workoutFocus || 'Daily Workout'}</h4>
                <p className="history-card-meta"><strong>Date:</strong> {log.date}</p>
                {log.createdAt && (
                  <p className="history-card-meta">
                    <strong>Entered:</strong> {new Date(log.createdAt).toLocaleString()}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="delete-button"
                onClick={() => deleteLog('dailyLogs', log.createdAt)}
              >
                Delete
              </button>
            </div>

            <div className="history-grid">
              <p className="history-field"><strong>Exercise 1:</strong> {log.exercise1} ({log.exercise1Weight} lbs x {log.exercise1Reps})</p>
              <p className="history-field"><strong>Exercise 2:</strong> {log.exercise2} ({log.exercise2Weight} lbs x {log.exercise2Reps})</p>
              <p className="history-field"><strong>Cardio:</strong> {log.cardioType}</p>
              <p className="history-field"><strong>Duration:</strong> {log.cardioDuration} minutes</p>
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
          <div key={log.createdAt || index} className="history-card">
            <div className="history-card-header">
              <div>
                <h4 className="history-card-title">Week of {log.weekStart}</h4>
                {log.createdAt && (
                  <p className="history-card-meta">
                    <strong>Entered:</strong> {new Date(log.createdAt).toLocaleString()}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="delete-button"
                onClick={() => deleteLog('weeklyLogs', log.createdAt)}
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
          <div key={log.createdAt || index} className="history-card">
            <div className="history-card-header">
              <div>
                <h4 className="history-card-title">Month: {log.month}</h4>
                {log.createdAt && (
                  <p className="history-card-meta">
                    <strong>Entered:</strong> {new Date(log.createdAt).toLocaleString()}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="delete-button"
                onClick={() => deleteLog('monthlyLogs', log.createdAt)}
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