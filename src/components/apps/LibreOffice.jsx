import { useState, useEffect } from 'react'

export default function LibreOffice() {
  const [iframeUrl, setIframeUrl] = useState('')
  const handleSubmit = async () => {
    const res = await fetch(`/api/api?url=https://cryptpad.fr`)
    const data = await res.json()
    if (data?.url) {
      setIframeUrl(data.url)
    } else {
      console.error("No url field in response:", data)
    }
  }
  useEffect(() => {
    handleSubmit()
  }, [])
  
  return (
    <div className="chrome-app">
      <div className="chrome-content" style={{ height: '100%' }}>
        <iframe
          src={iframeUrl}  
          title="LibreOffice"
          referrerPolicy="no-referrer"
          allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; display-capture; camera; microphone; fullscreen"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
