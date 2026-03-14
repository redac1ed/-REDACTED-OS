export default function Browser() {
  return (
    <div className="chrome-app">
      <div className="chrome-content" style={{ height: '100%' }}>
        <iframe
          src={import.meta.env.VITE_BROWSER_URL}
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
