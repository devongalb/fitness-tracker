import { useState } from 'react'
import { supabase } from '../lib/supabase'

function MonthlyLogForm() {
    const [monthlyForm, setMonthlyForm] = useState({
        month: '',
        weight: '',
        waist: '',
        bench: '',
        squat: '',
        deadlift: '',
        notes: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setMonthlyForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const { data: { user } } = await supabase.auth.getUser()

        const newLog = {
            user_id: user.id,
            month: monthlyForm.month,
            weight: monthlyForm.weight ? Number(monthlyForm.weight) : null,
            waist: monthlyForm.waist ? Number(monthlyForm.waist) : null,
            bench: monthlyForm.bench ? Number(monthlyForm.bench) : null,
            squat: monthlyForm.squat ? Number(monthlyForm.squat) : null,
            deadlift: monthlyForm.deadlift ? Number(monthlyForm.deadlift) : null,
            notes: monthlyForm.notes
        }

        const { error } = await supabase.from('monthly_logs').insert([newLog])

        if (error) {
            console.error('Error saving monthly log:', error)
            alert('Failed to save monthly progress')
            return
        }

        alert('Monthly progress saved')

        setMonthlyForm({
            month: '',
            weight: '',
            waist: '',
            bench: '',
            squat: '',
            deadlift: '',
            notes: ''
        })
    }

    return (
        <div className="page-container">
            <h2>Monthly Progress</h2>
            <p className="form-helper-text">
                Track monthly body measurements and strength progress.
            </p>


            <form onSubmit={handleSubmit} className="form-card">
                <div className="form-section">
                    <h3 className="form-section-title">Reporting Period</h3>

                    <label className="form-label">Reporting Month</label>
                    <select
                        className="form-input"
                        name="month"
                        value={monthlyForm.month}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a month</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                    </select>
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Body Measurements</h3>

                    <label className="form-label">Weight</label>
                    <input
                        className="form-input"
                        type="number"
                        min="0"
                        name="weight"
                        value={monthlyForm.weight}
                        onChange={handleChange}
                    />

                    <label className="form-label">Waist</label>
                    <input
                        className="form-input"
                        type="number"
                        min="0"
                        name="waist"
                        value={monthlyForm.waist}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Strength Progress</h3>

                    <label className="form-label">Bench</label>
                    <input
                        className="form-input"
                        type="number"
                        min="0"
                        name="bench"
                        value={monthlyForm.bench}
                        onChange={handleChange}
                    />

                    <label className="form-label">Squat</label>
                    <input
                        className="form-input"
                        type="number"
                        min="0"
                        name="squat"
                        value={monthlyForm.squat}
                        onChange={handleChange}
                    />

                    <label className="form-label">Deadlift</label>
                    <input
                        className="form-input"
                        type="number"
                        min="0"
                        name="deadlift"
                        value={monthlyForm.deadlift}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-section">
                    <h3 className="form-section-title">Notes</h3>

                    <label className="form-label">Monthly Notes</label>
                    <textarea
                        className="form-textarea"
                        name="notes"
                        value={monthlyForm.notes}
                        onChange={handleChange}
                        placeholder="Additional notes about your monthly progress..."
                        rows={4}
                    />
                </div>

                <button className="form-button" type="submit">
                    Save Monthly Progress
                </button>
            </form>
        </div>
    )
}

export default MonthlyLogForm