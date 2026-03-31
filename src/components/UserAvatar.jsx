export default function UserAvatar({ name = 'REDACTED', size = 80 }) {
  return (
    <div
      className="user-avatar"
      style={{
        width: size,
        height: size,
        background: '#6a6a6a',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: '600',
        color: 'white',
        letterSpacing: '0.02em',
        boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
        border: '3px solid rgba(255,255,255,0.25)',
        marginBottom: '0.6rem',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {ini}
    </div>
  )
}
