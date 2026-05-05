export default function Profile() {
  return (
    <div className="chrome-app">
      <div className="chrome-content" style={{ height: '100%' }}>
        <iframe
          src="https://redac.me"
          title="Profile"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
