export default function VSCode() {
  return (
    <div className="chrome-app">
      <div className="chrome-content" style={{ height: '100%' }}>
        <iframe
          src="https://github1s.com/redac1ed/-REDACTED-OS"  // you need an env for this to work
          title="VS Code"
          referrerPolicy="no-referrer"
          allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; display-capture; camera; microphone; fullscreen"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
