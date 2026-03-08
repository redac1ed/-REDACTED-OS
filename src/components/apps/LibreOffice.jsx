export default function LibreOffice() {
  return (
    <div className="chrome-app">
      <div className="chrome-content" style={{ height: '100%' }}>
        <iframe
          src={import.meta.env.VITE_LIBREOFFICE_URL}  // you need an env for this to work
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
