import { useState } from 'react'
import { supabase } from '../lib/supabase'

const WORKOUT_TYPE_OPTIONS = [
    'Chest',
    'Back',
    'Legs',
    'Shoulders',
    'Arms',
    'Upper Body',
    'Lower Body',
    'Full Body',
    'Cardio',
    'Mobility / Recovery',
    'Rest Day'
]

const STRENGTH_FOCUS_OPTIONS = new Set([
    'Chest',
    'Back',
    'Legs',
    'Shoulders',
    'Arms',
    'Upper Body',
    'Lower Body',
    'Full Body'
])

function DailyLogForm({ profile }) {
    const [dailyForm, setDailyForm] = useState({
        date: '',
        selectedWorkoutType: '',
        selectedWorkouts: [],
        exercises: [
            {
                id: 1,
                name: '',
                weight: '',
                reps: ''
            }
        ],
        cardioType: '',
        cardioDuration: '',
        notes: ''
    })

    const isRestDay = dailyForm.selectedWorkouts.includes('Rest Day')
    const needsStrengthFields = dailyForm.selectedWorkouts.some((workout) => STRENGTH_FOCUS_OPTIONS.has(workout))
    const needsCardioFields = dailyForm.selectedWorkouts.includes('Cardio')

    const handleDailyChange = (e) => {
        const { name, value } = e.target
        setDailyForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleAddWorkoutType = () => {
        if (!dailyForm.selectedWorkoutType) {
            return
        }

        setDailyForm((prev) => {
            const nextWorkout = prev.selectedWorkoutType

            if (prev.selectedWorkouts.includes(nextWorkout)) {
                return {
                    ...prev,
                    selectedWorkoutType: ''
                }
            }

            if (nextWorkout === 'Rest Day') {
                return {
                    ...prev,
                    selectedWorkoutType: '',
                    selectedWorkouts: ['Rest Day'],
                    exercises: [
                        {
                            id: 1,
                            name: '',
                            weight: '',
                            reps: ''
                        }
                    ],
                    cardioType: '',
                    cardioDuration: '',
                    notes: prev.notes || 'Rest day.'
                }
            }

            const nonRestSelections = prev.selectedWorkouts.filter((workout) => workout !== 'Rest Day')

            return {
                ...prev,
                selectedWorkoutType: '',
                selectedWorkouts: [...nonRestSelections, nextWorkout]
            }
        })
    }

    const handleRemoveWorkoutType = (workoutToRemove) => {
        setDailyForm((prev) => ({
            ...prev,
            selectedWorkouts: prev.selectedWorkouts.filter((workout) => workout !== workoutToRemove)
        }))
    }

    const handleExerciseChange = (exerciseId, field, value) => {
        setDailyForm((prev) => ({
            ...prev,
            exercises: prev.exercises.map((exercise) =>
                exercise.id === exerciseId
                    ? { ...exercise, [field]: value }
                    : exercise
            )
        }))
    }

    const handleAddExercise = () => {
        setDailyForm((prev) => {
            const nextId = prev.exercises.length === 0
                ? 1
                : Math.max(...prev.exercises.map((exercise) => exercise.id)) + 1

            return {
                ...prev,
                exercises: [
                    ...prev.exercises,
                    {
                        id: nextId,
                        name: '',
                        weight: '',
                        reps: ''
                    }
                ]
            }
        })
    }

    const handleRemoveExercise = (exerciseId) => {
        setDailyForm((prev) => {
            const remainingExercises = prev.exercises.filter((exercise) => exercise.id !== exerciseId)

            return {
                ...prev,
                exercises: remainingExercises.length > 0
                    ? remainingExercises
                    : [
                        {
                            id: 1,
                            name: '',
                            weight: '',
                            reps: ''
                        }
                    ]
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!profile?.id) {
            alert('No profile found for this account.')
            return
        }

        if (dailyForm.selectedWorkouts.length === 0) {
            alert('Select at least one workout type.')
            return
        }

        if (needsStrengthFields) {
            const hasIncompleteExercise = dailyForm.exercises.some(
                (exercise) => !exercise.name || !exercise.weight || !exercise.reps
            )

            if (hasIncompleteExercise) {
                alert('Complete all exercise fields or remove unused exercise rows.')
                return
            }
        }

        const workoutFocusValue = isRestDay
            ? 'Rest Day'
            : dailyForm.selectedWorkouts.join(', ')

        const exerciseEntries = needsStrengthFields ? dailyForm.exercises : []
        const exercise1 = exerciseEntries[0] || { name: 'N/A', weight: 0, reps: 0 }
        const exercise2 = exerciseEntries[1] || { name: 'N/A', weight: 0, reps: 0 }
        const additionalExercises = exerciseEntries.slice(2)

        const newLog = {
            profile_id: profile.id,
            user_id: profile.id,
            date: dailyForm.date,
            workout_focus: workoutFocusValue,
            exercise1: needsStrengthFields ? exercise1.name : 'N/A',
            exercise1_weight: needsStrengthFields ? Number(exercise1.weight) : 0,
            exercise1_reps: needsStrengthFields ? Number(exercise1.reps) : 0,
            exercise2: needsStrengthFields ? exercise2.name : 'N/A',
            exercise2_weight: needsStrengthFields ? Number(exercise2.weight) : 0,
            exercise2_reps: needsStrengthFields ? Number(exercise2.reps) : 0,
            cardio_type: needsCardioFields ? dailyForm.cardioType : isRestDay ? 'Rest Day' : 'N/A',
            cardio_duration: needsCardioFields ? Number(dailyForm.cardioDuration) : 0,
            notes: additionalExercises.length > 0
                ? `${dailyForm.notes ? `${dailyForm.notes}\n\n` : ''}Additional exercises: ${additionalExercises
                    .map((exercise) => `${exercise.name} - ${exercise.weight} x ${exercise.reps}`)
                    .join('; ')}`
                : dailyForm.notes
        }

        const { error } = await supabase.from('daily_logs').insert([newLog])

        if (error) {
            console.error('Error saving daily log:', error)
            alert('Failed to save workout')
            return
        }

        alert('Workout saved')

        setDailyForm({
            date: '',
            selectedWorkoutType: '',
            selectedWorkouts: [],
            exercises: [
                {
                    id: 1,
                    name: '',
                    weight: '',
                    reps: ''
                }
            ],
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

                    <label className="form-label">Date</label>
                    <input
                        className="form-input"
                        type="date"
                        name="date"
                        value={dailyForm.date}
                        onChange={handleDailyChange}
                        required
                    />

                    <label className="form-label">Workout Type</label>
                    <select
                        className="form-input"
                        name="selectedWorkoutType"
                        value={dailyForm.selectedWorkoutType}
                        onChange={handleDailyChange}
                    >
                        <option value="">Select workout type</option>
                        {WORKOUT_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="form-button"
                        onClick={handleAddWorkoutType}
                        style={{ marginTop: 0 }}
                    >
                        Add Workout Type
                    </button>

                    {dailyForm.selectedWorkouts.length > 0 && (
                        <div className="history-card">
                            <p><strong>Selected Workouts:</strong></p>
                            {dailyForm.selectedWorkouts.map((workout) => (
                                <div key={workout} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                                    <span>{workout}</span>
                                    <button
                                        type="button"
                                        className="delete-button"
                                        onClick={() => handleRemoveWorkoutType(workout)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Exercises</h3>

                    {dailyForm.exercises.map((exercise, index) => (
                        <div key={exercise.id} className="history-card">
                            <p><strong>Exercise {index + 1}</strong></p>

                            <label className="form-label">Exercise Name</label>
                            <input
                                className="form-input"
                                type="text"
                                value={exercise.name}
                                onChange={(e) => handleExerciseChange(exercise.id, 'name', e.target.value)}
                                placeholder="Bench Press"
                                disabled={!needsStrengthFields}
                                required={needsStrengthFields}
                            />

                            <label className="form-label">Weight</label>
                            <input
                                className="form-input"
                                type="number"
                                min="0"
                                value={exercise.weight}
                                onChange={(e) => handleExerciseChange(exercise.id, 'weight', e.target.value)}
                                placeholder="Weight used"
                                disabled={!needsStrengthFields}
                                required={needsStrengthFields}
                            />

                            <label className="form-label">Reps</label>
                            <input
                                className="form-input"
                                type="number"
                                min="0"
                                value={exercise.reps}
                                onChange={(e) => handleExerciseChange(exercise.id, 'reps', e.target.value)}
                                placeholder="Number of reps"
                                disabled={!needsStrengthFields}
                                required={needsStrengthFields}
                            />

                            <button
                                type="button"
                                className="delete-button"
                                onClick={() => handleRemoveExercise(exercise.id)}
                                disabled={!needsStrengthFields}
                            >
                                Remove Exercise
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        className="form-button"
                        onClick={handleAddExercise}
                        disabled={!needsStrengthFields}
                    >
                        Add Exercise
                    </button>
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
                        disabled={!needsCardioFields}
                        required={needsCardioFields}
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
                        disabled={!needsCardioFields}
                        required={needsCardioFields}
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