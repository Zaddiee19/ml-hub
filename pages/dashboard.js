import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.push('/login')
      } else {
        setUser(data.session.user)
      }
    }

    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    alert('Logged out!')
    router.push('/login')
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Dashboard</h2>

        {user && (
          <>
            <p>Welcome!</p>
            <p><strong>{user.email}</strong></p>
          </>
        )}

        <button className="primary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}