import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSignUp = async () => {
    if (!email || !password) {
      alert('Please enter email and password!')
      return
    }

    alert('Creating account...')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Signup successful!')
      router.push('/login') // redirect to login
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ borderTop: '5px solid green' }}>
        <h2>Create Account</h2>

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