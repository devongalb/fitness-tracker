import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Auth() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [cooldown, setCooldown] = useState(0)

    const handleLogin = async (e) => {
        e.preventDefault()
        if (cooldown > 0) return

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
            setCooldown(60)

            const timer = setInterval(() => {
                setCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
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

                    <label className="form-label">Email Address</label>
                    <input
                        className="form-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                    />
                </div>

                <button className="form-button" type="submit" disabled={loading || cooldown > 0}>
                    {loading ? 'Sending Link...' : cooldown > 0 ? `Try again in ${cooldown}s` : 'Send Login Link'}
                </button>

                {message && <p className="form-helper-text">{message}</p>}
            </form>
        </div>
    )
}

export default Auth