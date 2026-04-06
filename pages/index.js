import Link from 'next/link'

export default function Home() {
  return (
    <div className="container">
      <div className="card">
        <h1>Machine Learning Hub</h1>
        <p>Explore simple machine learning concepts and tools.</p>

        <Link href="/login">
          <button className="primary">Login</button>
        </Link>

        <Link href="/signup">
          <button className="secondary">Sign Up</button>
        </Link>
      </div>
    </div>
  )
}