import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      alert('Please fill in all fields!')
      return
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    alert('Creating account...')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // store name in user metadata
        },
      },
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Signup successful!')
      router.push('/login')
    }
  }

  return (
    <div className="auth-container">
    <div className="auth-card"style={{ borderTop: '3px solid rgba(255, 255, 255, 0.2)' }}>
        <h2>Create Account</h2>

        <input
          type="text"
          placeholder="Enter your name"
          onChange={(e) => setName(e.target.value)}
        />

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

        <input
          type="password"
          placeholder="Confirm your password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button className="primary" onClick={handleSignUp}>
          Sign Up
        </button>

        <p>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}