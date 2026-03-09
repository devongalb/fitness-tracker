import { useState } from 'react'
import { supabase } from '../lib/supabase'

function DailyLogForm() {
    const [dailyForm, setDailyForm] = useState({
        date: '',
        workoutFocus: '',
        exercise1: '',
        exercise1Weight: '',
        exercise1Reps: '',
        exercise2: '',
        exercise2Weight: '',
        exercise2Reps: '',
        cardioType: '',
        cardioDuration: '',
        notes: ''
    })

    const handleDailyChange = (e) => {
        const { name, value } = e.target
        setDailyForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const { data: { user } } = await supabase.auth.getUser()

        const newLog = {
            user_id: user.id,
            date: dailyForm.date,
            workout_focus: dailyForm.workoutFocus,
            exercise1: dailyForm.exercise1,
            exercise1_weight: Number(dailyForm.exercise1Weight),
            exercise1_reps: Number(dailyForm.exercise1Reps),
            exercise2: dailyForm.exercise2,
            exercise2_weight: Number(dailyForm.exercise2Weight),
            exercise2_reps: Number(dailyForm.exercise2Reps),
            cardio_type: dailyForm.cardioType,
            cardio_duration: Number(dailyForm.cardioDuration),
            notes: dailyForm.notes
        }

        await supabase.from('daily_logs').insert([newLog])

        if (error) {
            console.error('Error saving daily log:', error)
            alert('Failed to save workout')
            return
        }

        alert('Workout saved')

        setDailyForm({
            date: '',
            workoutFocus: '',
            exercise1: '',
            exercise1Weight: '',
            exercise1Reps: '',
            exercise2: '',
            exercise2Weight: '',
            exercise2Reps: '',
            cardioType: '',
            cardioDuration: '',
            notes: ''
        })
    }

    return (
        <div className="page-container">
            <h2>Daily Workout Log</h2>

            <form onSubmit={handleSubmit} className="form-card">
                <div className="form-section">
                    <h3 className="form-section-title">Workout Information</h3>

                    <label className="form-label">Date</label>
                    <input
                        className="form-input"
                        type="date"
                        name="date"
                        value={dailyForm.date}
                        onChange={handleDailyChange}
                        required
                    />

                    <label className="form-label">Workout Focus</label>
                    <input
                        className="form-input"
                        type="text"
                        name="workoutFocus"
                        value={dailyForm.workoutFocus}
                        onChange={handleDailyChange}
                        placeholder="Leg day, push, pull, etc."
                        required
                    />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Exercise 1</h3>

                    <label className="form-label">Exercise Name</label>
                    <input
                        className="form-input"
                        type="text"
                        name="exercise1"
                        value={dailyForm.exercise1}
                        onChange={handleDailyChange}
                        placeholder="Bench Press"
                        required
                    />

                    <label className="form-label">Weight</label>
                    <input
                        className="form-input"
                        type="number"
                        min="0"
                        name="exercise1Weight"
                        value={dailyForm.exercise1Weight}
                        onChange={handleDailyChange}
                        placeholder="Weight used"
                        required
                    />

                    <label className="form-label">Reps</label>
                    <input
                        className="form-input"
                        type="number"
                        min="0"
                        name="exercise1Reps"
                        value={dailyForm.exercise1Reps}
                        onChange={handleDailyChange}
                        placeholder="Number of reps"
                        required
                    />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Exercise 2</h3>

                    <label className="form-label">Exercise Name</label>
                    <input
                        className="form-input"
                        type="text"
                        name="exercise2"
                        value={dailyForm.exercise2}
                        onChange={handleDailyChange}
                        placeholder="Squats"
                        required
                    />

                    <label className="form-label">Weight</label>
                    <input
                        className="form-input"
                        type="number"
                        min="0"
                        name="exercise2Weight"
                        value={dailyForm.exercise2Weight}
                        onChange={handleDailyChange}
                        placeholder="Weight used"
                        required
                    />

                    <label className="form-label">Reps</label>
                    <input
                        className="form-input"
                        type="number"
                        min="0"
                        name="exercise2Reps"
                        value={dailyForm.exercise2Reps}
                        onChange={handleDailyChange}
                        placeholder="Number of reps"
                        required
                    />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Cardio</h3>

                    <label className="form-label">Cardio Type</label>
                    <input
                        className="form-input"
                        type="text"
                        name="cardioType"
                        value={dailyForm.cardioType}
                        onChange={handleDailyChange}
                        placeholder="Run, Bike, Row"
                        required
                    />

                    <label className="form-label">Cardio Duration (minutes)</label>
                    <input
                        className="form-input"
                        type="number"
                        min="0"
                        name="cardioDuration"
                        value={dailyForm.cardioDuration}
                        onChange={handleDailyChange}
                        placeholder="Duration in minutes"
                        required
                    />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Notes</h3>

                    <label className="form-label">Workout Notes</label>
                    <textarea
                        className="form-textarea"
                        name="notes"
                        value={dailyForm.notes}
                        onChange={handleDailyChange}
                        placeholder="How did the workout feel?"
                        rows={4}
                    />
                </div>

                <button className="form-button" type="submit">
                    Save Workout
                </button>
            </form>
        </div>
    )
}

export default DailyLogForm