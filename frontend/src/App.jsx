import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [accountNumber, setAccountNumber] = useState('')
  const [password, setPassword] = useState('')
  const [userData, setUserData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [token, setToken] = useState(localStorage.getItem('aeronet_token') || '')
  

  const [pingUrl, setPingUrl] = useState('')
  const [pingResult, setPingResult] = useState('')

  // Helper to decode JWT without extra libraries
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      return JSON.parse(window.atob(base64))
    } catch (e) {
      return {}
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('aeronet_token')
    if (savedToken) {
      fetch('http://localhost:5000/api/verify', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(response => response.json())
      .then(data => {
        if (data.valid) {
          const decoded = decodeJWT(savedToken)
          setIsLoggedIn(true)
          setUserData({ account_number: decoded.account_number, bill_amount: 'System Cached' })
        } else {
          localStorage.removeItem('aeronet_token')
          setToken('')
          setIsLoggedIn(false)
          setErrorMsg("Session invalid or tampered with. Please log in again.")
        }
      })
      .catch(() => {
        setErrorMsg("Failed to verify session with server.")
      })
    }
  }, [])

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_number: accountNumber, password: password })
      })
      const data = await response.json()

      if (data.success) {
        setUserData(data.data)
        setToken(data.token)
        localStorage.setItem('aeronet_token', data.token)
        setIsLoggedIn(true)
        setErrorMsg('')
      } else {
        setErrorMsg(data.message)
      }
    } catch (err) {
      setErrorMsg("Connection error.")
    }
  }

  const handlePing = async () => {
    setPingResult('Pinging...')
    try {
      const response = await fetch('http://localhost:5000/api/admin/system_ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: pingUrl })
      })
      const data = await response.json()
      setPingResult(data.response_snippet || data.message)
    } catch (err) {
      setPingResult("Request failed.")
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <h1>🌐 AeroNet Telecom</h1>
        <div className="login-box">
          <input type="text" placeholder="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Secure Login</button>
        </div>
        {errorMsg && <p style={{color: 'red'}}>{errorMsg}</p>}
      </div>
    )
  }

  const decodedToken = decodeJWT(token)

  return (
    <div className="dashboard-container">
      <header>
        <h1>🌐 AeroNet Telecom</h1>
        <button onClick={() => {
          setIsLoggedIn(false); 
          setUserData(null); 
          setErrorMsg(''); 
          setToken('');
          localStorage.removeItem('aeronet_token');
          }}>
            Logout
        </button>
      </header>
      
      <main>
        <h2>Welcome back, {userData.account_number}!</h2>
        <p><strong>Your Current Role:</strong> {decodedToken.role || 'customer'}</p>
        
        {decodedToken.role === 'admin' ? (
          <div className="card" style={{borderColor: 'red', borderWidth: '2px', borderStyle: 'solid'}}>
            <h3 style={{color: 'red'}}>Admin Diagnostic Tool</h3>
            <p>Enter a URL to check system connectivity:</p>
            <input 
              type="text" 
              placeholder="http://example.com" 
              value={pingUrl} 
              onChange={(e) => setPingUrl(e.target.value)}
              style={{width: '80%', padding: '5px'}}
            />
            <button onClick={handlePing} style={{marginLeft: '10px'}}>Ping</button>
            <pre style={{background: '#eee', padding: '10px', marginTop: '10px', overflowX: 'auto'}}>
              {pingResult}
            </pre>
          </div>
        ) : (
          <div className="card">
            <h3>Standard Customer Dashboard</h3>
            <p>Your current bill is £{userData.bill_amount}</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App