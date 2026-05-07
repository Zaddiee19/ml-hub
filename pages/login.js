import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password!')
      return
    }

    alert('Logging in...')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Login successful!')
      router.push('/dashboard') // ✅ redirect
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card"style={{ borderTop: '3px solid rgba(255, 255, 255, 0.2)' }}>
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter your password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary" onClick={handleLogin}>
          Login
        </button>

        <p>
          No account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}