import { useState } from 'react'
import { supabase } from '../lib/supabase'

function DailyLogForm({ profile }) {
    const [dailyForm, setDailyForm] = useState({
        restDay: false,
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
        const { name, value, type, checked } = e.target
        const nextValue = type === 'checkbox' ? checked : value

        setDailyForm((prev) => {
            if (name === 'restDay') {
                return {
                    ...prev,
                    restDay: checked,
                    workoutFocus: checked ? 'Rest Day' : prev.workoutFocus,
                    exercise1: checked ? '' : prev.exercise1,
                    exercise1Weight: checked ? '' : prev.exercise1Weight,
                    exercise1Reps: checked ? '' : prev.exercise1Reps,
                    exercise2: checked ? '' : prev.exercise2,
                    exercise2Weight: checked ? '' : prev.exercise2Weight,
                    exercise2Reps: checked ? '' : prev.exercise2Reps,
                    cardioType: checked ? '' : prev.cardioType,
                    cardioDuration: checked ? '' : prev.cardioDuration,
                    notes: checked && !prev.notes ? 'Rest day.' : prev.notes
                }
            }

            return {
                ...prev,
                [name]: nextValue
            }
        })
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
            date: dailyForm.date,
            workout_focus: dailyForm.restDay ? 'Rest Day' : dailyForm.workoutFocus,
            exercise1: dailyForm.restDay ? 'Rest Day' : dailyForm.exercise1,
            exercise1_weight: dailyForm.restDay ? 0 : Number(dailyForm.exercise1Weight),
            exercise1_reps: dailyForm.restDay ? 0 : Number(dailyForm.exercise1Reps),
            exercise2: dailyForm.restDay ? 'Rest Day' : dailyForm.exercise2,
            exercise2_weight: dailyForm.restDay ? 0 : Number(dailyForm.exercise2Weight),
            exercise2_reps: dailyForm.restDay ? 0 : Number(dailyForm.exercise2Reps),
            cardio_type: dailyForm.restDay ? 'Rest Day' : dailyForm.cardioType,
            cardio_duration: dailyForm.restDay ? 0 : Number(dailyForm.cardioDuration),
            notes: dailyForm.notes
        }

        const { error } = await supabase.from('daily_logs').insert([newLog])

        if (error) {
            console.error('Error saving daily log:', error)
            alert('Failed to save workout')
            return
        }

        alert('Workout saved')

        setDailyForm({
            restDay: false,
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
            <p className="form-helper-text">
                Record your daily workout details, cardio, and notes.
            </p>

            <form onSubmit={handleSubmit} className="form-card">
                <div className="form-section">
                    <h3 className="form-section-title">Workout Information</h3>

                    <label className="form-label">
                        <input
                            type="checkbox"
                            name="restDay"
                            checked={dailyForm.restDay}
                            onChange={handleDailyChange}
                            style={{ marginRight: '8px' }}
                        />
                        Rest Day
                    </label>

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
                        required={!dailyForm.restDay}
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
                        disabled={dailyForm.restDay}
                        required={!dailyForm.restDay}
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
                        disabled={dailyForm.restDay}
                        required={!dailyForm.restDay}
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
                        disabled={dailyForm.restDay}
                        required={!dailyForm.restDay}
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
                        disabled={dailyForm.restDay}
                        required={!dailyForm.restDay}
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
                        disabled={dailyForm.restDay}
                        required={!dailyForm.restDay}
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
                        disabled={dailyForm.restDay}
                        required={!dailyForm.restDay}
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
                        disabled={dailyForm.restDay}
                        required={!dailyForm.restDay}
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
                        disabled={dailyForm.restDay}
                        required={!dailyForm.restDay}
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