import { useState } from "react"

export default function Browser() {
  const [iframeUrl, setIframeUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('https://google.com') //for now
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    setLoading(true)
    const res = await fetch(`http://127.0.0.1:5000/api/browser-proxy?url=${encodeURIComponent(inputUrl)}`)
    const data = await res.json()
    if (data?.url) {
      setIframeUrl(data.url)
    } else {
      console.error("No url field in response:", data)
    }
    setLoading(false)
  }

  return (
    <div className="chrome-app">
      <div style={{ padding: '8px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          style={{ flex: 1, padding: '6px', width: '80%' }}
        />
        <button onClick={handleSubmit} disabled={loading} style={{ padding: '6px 12px', marginLeft: '8px' }}>
          {loading? 'Loading...' : 'Go'}
        </button>
      </div>
      <div className="chrome-content" style={{ height: '100%' }}>
        <iframe
          src={iframeUrl}
          title="Browser Content"
          referrerPolicy="no-referrer"
          allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; display-capture; camera; microphone; fullscreen; storage-access"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
