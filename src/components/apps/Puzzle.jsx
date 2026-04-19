import { useState } from 'react'
import '../components.css'

export default function Puzzle() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const CORRECT_PASSWORD = import.meta.env.VITE_PUZZLE_PASSWORD
  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
      setError('')
      setPassword('')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }
  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    setError('')
  }
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#fff', padding: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#000' }}>Protected Content</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '8px', border: '1px solid #000', background: '#fff', color: '#000', fontFamily: 'inherit', fontSize: '14px' }}
            autoFocus
          />
          <button type="submit" style={{ padding: '8px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Unlock</button>
          {error && <p style={{ color: '#d32f2f', fontSize: '12px', margin: '0' }}>{error}</p>}
        </form>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', color: '#000' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #000' }}>
        <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Logout</button>
      </div>
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
        <div style={{ background: '#ffffff', padding: '12px', border: '1px solid #ffffff' }}>
          <div style={{ marginBottom: '10px' }}><strong>unlucky.n:</strong> yo, found something interesting about this machine</div>
          <div style={{ marginBottom: '10px' }}><strong>sarcasmking:</strong> wut</div>
          <div style={{ marginBottom: '10px' }}><strong>unlucky.n:</strong> this pc is hell of a beast</div>
          <div style={{ marginBottom: '10px' }}><strong>sarcasmking:</strong> noice, any chance of getting in?</div>
          <div style={{ marginBottom: '10px' }}><strong>unlucky.n:</strong> ig let me try atleast but the owner is so dumb</div>
          <div style={{ marginBottom: '10px' }}><strong>sarcasmking:</strong> lamao then get in dummy</div>
          <div style={{ marginBottom: '10px' }}><strong>unlucky.n:</strong>  ye but let me find some more info</div>
          <div style={{ marginBottom: '10px' }}><strong>sarcasmking:</strong> wym vro</div>
          <div style={{ marginBottom: '10px' }}><strong>unlucky.n:</strong> found a reference: <span style={{ textDecoration: 'line-through' }}>/skibidilink/kimjonggoon/aeaxzzeans</span></div>
          <div style={{ marginBottom: '10px' }}><strong>sarcasmking:</strong> son its broken</div>
          <div style={{ marginBottom: '10px' }}><strong>unlucky.n:</strong> fahhhhhhhhhh then why did u say its the best target</div>
          <div style={{ marginBottom: '10px' }}><strong>sarcasmking:</strong> idk i thought it had some vunerability</div>
        </div>
      </div>
    </div>
  )
}
