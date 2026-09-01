export default function Deltarune() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#000' }}>
      <iframe
        src="/deltarune/index.html?mode=normal"
        title="Deltarune"
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          border: 'none',
          background: '#000',
        }}
      />
    </div>
  )
}