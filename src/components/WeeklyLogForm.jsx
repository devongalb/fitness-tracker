import { useState } from 'react'

function WeeklyLogForm() {
    const [weeklyForm, setWeeklyForm] = useState({
        weekStart: '',
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        notes: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setWeeklyForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }
    const handleSubmit = (e) => {
        e.preventDefault()

        const newLog = {
            ...weeklyForm,
            createdAt: new Date().toISOString()
        }


        const existingLogs = JSON.parse(localStorage.getItem('weeklyLogs')) || []
        const updatedLogs = [newLog, ...existingLogs]

        localStorage.setItem('weeklyLogs', JSON.stringify(updatedLogs))

        alert('Weekly log saved')

        setWeeklyForm({
            weekStart: '',
            monday: '',
            tuesday: '',
            wednesday: '',
            thursday: '',
            friday: '',
            saturday: '',
            notes: ''
        })
    }

    return (
        <div className='page-container'>
            <h2>Weekly Workout Log</h2>

            <form onSubmit={handleSubmit} className='form-card'>
                <div className="form-section">
                    <h3 className="form-section-title">Week Overview</h3>

                    <label className="form-label">Week Starting</label>
                    <input
                        type="date"
                        name="weekStart"
                        value={weeklyForm.weekStart}
                        onChange={handleChange}
                        className="form-input"
                    />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Training Days</h3>

                    <label className="form-label">Monday Workout</label>
                    <input
                        type="text"
                        name="monday"
                        value={weeklyForm.monday}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Upper body, run, recovery, etc."
                    />

                    <label className="form-label">Tuesday Workout</label>
                    <input
                        type="text"
                        name="tuesday"
                        value={weeklyForm.tuesday}
                        onChange={handleChange}
                        className="form-input"
                    />

                    <label className="form-label">Wednesday Workout</label>
                    <input
                        type="text"
                        name="wednesday"
                        value={weeklyForm.wednesday}
                        onChange={handleChange}
                        className="form-input"
                    />

                    <label className="form-label">Thursday Workout</label>
                    <input
                        type="text"
                        name="thursday"
                        value={weeklyForm.thursday}
                        onChange={handleChange}
                        className="form-input"
                    />

                    <label className="form-label">Friday Workout</label>
                    <input
                        type="text"
                        name="friday"
                        value={weeklyForm.friday}
                        onChange={handleChange}
                        className="form-input"
                    />

                    <label className="form-label">Saturday Workout</label>
                    <input
                        type="text"
                        name="saturday"
                        value={weeklyForm.saturday}
                        onChange={handleChange}
                        className="form-input"
                    />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Notes</h3>

                    <label className="form-label">Weekly Notes</label>
                    <textarea
                        name="notes"
                        value={weeklyForm.notes}
                        onChange={handleChange}
                        className="form-textarea"
                        rows={4}
                        placeholder="Overall notes for the week"
                    />
                </div>

                <button type="submit" className="form-button">Save Weekly Log</button>
            </form>
        </div>
    )
}

export default WeeklyLogForm