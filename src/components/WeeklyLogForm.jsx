import { useState } from 'react'
import { supabase } from '../lib/supabase'

function WeeklyLogForm({ profile }) {
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

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!profile?.id) {
            alert('No profile found for this account.')
            return
        }

        const newLog = {
            profile_id: profile.id,
            user_id: profile.id,
            week_start: weeklyForm.weekStart || null,
            monday: weeklyForm.monday,
            tuesday: weeklyForm.tuesday,
            wednesday: weeklyForm.wednesday,
            thursday: weeklyForm.thursday,
            friday: weeklyForm.friday,
            saturday: weeklyForm.saturday,
            notes: weeklyForm.notes
        }

        const { error } = await supabase.from('weekly_logs').insert([newLog])

        if (error) {
            console.error('Error saving weekly log:', error)
            alert('Failed to save weekly log')
            return
        }

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
        <div className="page-container">
            <h2>Weekly Workout Log</h2>
            <p className="form-helper-text">
                Review and save your workouts completed throughout the week.
            </p>

            <form onSubmit={handleSubmit} className="form-card">
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