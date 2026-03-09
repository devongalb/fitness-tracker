import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Auth() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true
            }
        })

        if (error) {
            setMessage(error.message)
        } else {
            setMessage('Check your email for the login link.')
        }

        setLoading(false)
    }

    return (
        <div className="page-container">
            <h2>Sign In</h2>
            <p className="form-helper-text">
                Enter your email to receive a secure login link.
            </p>

            <form onSubmit={handleLogin} className="form-card">
                <div className="form-section">
                    <h3 className="form-section-title">Email Login</h3>

                    <input
                        className="form-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                    />
                </div>

                <button className="form-button" type="submit" disabled={loading}>
                    {loading ? 'Sending Link...' : 'Send Login Link'}
                </button>

                {message && <p className="form-helper-text">{message}</p>}
            </form>
        </div>
    )
}

export default Auth