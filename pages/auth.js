import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const router = useRouter()

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      alert('Please fill in all fields')
      return
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return alert(error.message)

      router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) return alert(error.message)

      alert('Account created successfully!')
      setIsLogin(true)
    }
  }

  return (
    <div className="auth-container">
      <div className={`auth-card ${isLogin ? 'login' : 'signup'}`}>

        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

        <p>
          {isLogin
            ? 'Login to continue to your dashboard'
            : 'Sign up to get started'}
        </p>

        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary" onClick={handleAuth}>
          {isLogin ? 'Login' : 'Sign Up'}
        </button>

        <p>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
        </p>

        <a onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Create one' : 'Login instead'}
        </a>

      </div>
    </div>
  )
}