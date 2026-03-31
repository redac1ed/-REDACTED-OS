import { useEffect, useMemo, useState } from 'react'
import {
  MdPalette,
  MdMonitor,
  MdNotifications,
  MdVolumeUp,
  MdInfo,
  MdKeyboardArrowRight,
  MdArrowBack,
  MdWallpaper,
  MdColorLens,
  MdRestartAlt,
} from 'react-icons/md'
import { useUser } from '../../contexts/UserContext'

export default function Settings({ initialTab = 'system', initialSubPage = null }) {
  const {
    user,
    theme,
    setThemePreset,
    availableThemes,
    currentColors,
    updateCustomTheme,
    setWallpaper,
    resetCustomTheme,
    brightness,
    setBrightness,
    nightLight,
    setNightLight,
  } = useUser()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [subPage, setSubPage] = useState(initialSubPage)
  const [customBgUrl, setCustomBgUrl] = useState('')
  useEffect(() => {
    setActiveTab(initialTab)
    setSubPage(initialSubPage)
  }, [initialTab, initialSubPage])
  const bgPreview = currentColors['--desktop-bg'] || "url('/primary-bg.jpg')"
  const [volume, setVolume] = useState(50)
  const [outputDevice, setOutputDevice] = useState('Speakers (Realtek(R) Audio)')
  const [globalNotifications, setGlobalNotifications] = useState(true)
  const [dndMode, setDndMode] = useState(false)
  const [appNotifications, setAppNotifications] = useState({
    snippingTool: true,
    browser: true,
    explorer: false,
    system: true
  })
  const handleTabChange = (id) => {
    setActiveTab(id)
    setSubPage(null)
  }
  const navItems = [
    { id: 'system', label: 'System', icon: <MdMonitor size={18} /> },
    { id: 'personalization', label: 'Personalization', icon: <MdPalette size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <MdNotifications size={18} /> },
    { id: 'about', label: 'About', icon: <MdInfo size={18} /> },
  ]
  const handleColorChange = (key, value) => {
    updateCustomTheme({ [key]: value });
  };
  const parseRgbaToHex = (value, fallback = '#202020') => {
    if (!value) return fallback
    if (value.startsWith('#')) return value
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
    if (!match) return fallback
    const [r, g, b] = [match[1], match[2], match[3]].map((v) => Number(v).toString(16).padStart(2, '0'))
    return `#${r}${g}${b}`
  }
  const wallpaperOptions = useMemo(
    () => [
      '/primary-bg.jpg',
      'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=3840&q=100',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=3840&q=100',
      'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=3840&q=100',
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=3840&q=100',
      'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=3840&q=100',
    ],
    []
  )
  const quickAccents = ['#0078d4', '#4ca8ff', '#00c2a8', '#ff5ca8', '#c86cff', '#f59e0b']

  return (
    <div className="settings-shell">
      <div className="settings-sidebar-glass">
        <div className="settings-user-card">
          <img style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} src={user.avatar} alt={user.name} />
          <div style={{ fontSize: '14px' }}>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div style={{ opacity: 0.6, fontSize: '12px' }}>{user.accountType}</div>
          </div>
        </div>
        <div className="nav-list" style={{ flex: 1 }}>
          {navItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => handleTabChange(item.id)}
              className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span style={{ fontSize: '13px' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="settings-main">
        {subPage ? (
          <div className="subpage-container">
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', opacity: 0.85, fontSize: '15px' }}
              onClick={() => setSubPage(null)}
            >
              <MdArrowBack />
              <span>Back</span>
            </div>
            <h1 className="settings-page-title" style={{ fontSize: '24px' }}>{subPage.title}</h1>
            {subPage.id === 'display' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="settings-panel">
                  <div style={{ marginBottom: '12px', fontWeight: 500 }}>Brightness</div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--theme-accent-color)' }} 
                  />
                  <div className="settings-muted" style={{ marginTop: '8px' }}>{brightness}%</div>
                </div>
                <div className="settings-panel">
                  <div style={{ marginBottom: '12px', fontWeight: 500 }}>Night light</div>
                  <button 
                    className={`settings-btn ${nightLight ? 'primary' : ''}`}
                    onClick={() => setNightLight(!nightLight)}
                  >
                    {nightLight ? 'Turn off now' : 'Turn on now'}
                  </button>
                </div>
              </div>
            )}
            {subPage.id === 'sound' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="settings-panel">
                  <div style={{ marginBottom: '12px', fontWeight: 500 }}>Output</div>
                  <select 
                    className="settings-select"
                    value={outputDevice}
                    onChange={(e) => setOutputDevice(e.target.value)}
                  >
                    <option>Speakers (Realtek(R) Audio)</option>
                    <option>Headphones</option>
                    <option>Bluetooth Audio</option>
                  </select>
                </div>
                <div className="settings-panel">
                  <div style={{ marginBottom: '12px', fontWeight: 500 }}>Volume</div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--theme-accent-color)' }} 
                  />
                  <div className="settings-muted" style={{ marginTop: '8px' }}>{volume}%</div>
                </div>
              </div>
            )}
            {subPage.id === 'background' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="settings-panel">
                  <div className="settings-section-title">Choose your picture</div>
                  <div className="wallpaper-grid" style={{ marginBottom: '16px' }}>
                    {wallpaperOptions.map((url, i) => (
                      <div 
                        key={i}
                        onClick={() => setWallpaper(url)}
                        className={`wallpaper-thumb ${bgPreview.includes(url) ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${url})` }}
                      />
                    ))}
                  </div>
                  
                  <div className="settings-section-title">Custom background URL</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={customBgUrl} 
                      onChange={(e) => setCustomBgUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="settings-input"
                      style={{ flex: 1 }}
                    />
                    <button 
                      onClick={() => setWallpaper(customBgUrl)}
                      className="settings-btn primary"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
            {subPage.id === 'themes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="settings-panel">
                  <div className="settings-row">
                    <div>
                      <div className="settings-section-title" style={{ marginBottom: 2 }}>Theme presets</div>
                      <div className="settings-muted">High quality color systems with glass tuning</div>
                    </div>
                    <button className="settings-btn" onClick={resetCustomTheme}>
                      <MdRestartAlt size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                      Reset custom
                    </button>
                  </div>
                  <div className="theme-grid">
                     {Object.entries(availableThemes).map(([key, t]) => (
                        <div 
                          key={key}
                          onClick={() => setThemePreset(key)}
                          className={`theme-card ${theme === key ? 'theme-selected' : ''}`}
                        >
                           <div
                            className="theme-preview"
                            style={{
                              background: `linear-gradient(145deg, ${t.colors['--theme-bg-color']}, rgba(${t.colors['--theme-taskbar-color-rgb'] || '0,0,0'}, 0.9))`,
                            }}
                           />
                           <div className="theme-label">
                            <span>{t.name}</span>
                            {theme === key && <span>✓</span>}
                           </div>
                        </div>
                     ))}
                  </div>
                </div>
                <div className="settings-panel">
                  <div className="settings-section-title">Custom style options</div>
                  <div className="settings-muted" style={{ marginBottom: 12 }}>Changes apply desktop-wide and save automatically.</div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>Quick accent</div>
                    <div className="accent-swatches">
                      {quickAccents.map((accent) => (
                        <button
                          key={accent}
                          className="swatch"
                          style={{ background: accent }}
                          onClick={() => {
                            handleColorChange('--theme-accent-color', accent)
                            const r = parseInt(accent.slice(1, 3), 16)
                            const g = parseInt(accent.slice(3, 5), 16)
                            const b = parseInt(accent.slice(5, 7), 16)
                            handleColorChange('--theme-accent-rgb', `${r}, ${g}, ${b}`)
                          }}
                          title={accent}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="color-grid">
                    
                    <div className="color-field">
                      <div>
                        <div style={{ fontSize: '13px', marginBottom: '2px' }}>Accent color</div>
                        <div className="settings-muted">Highlights, focus, active controls</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="color" 
                          value={parseRgbaToHex(currentColors['--theme-accent-color'], '#4ca8ff')}
                          onChange={(e) => {
                            const hex = e.target.value
                            handleColorChange('--theme-accent-color', hex)
                            const r = parseInt(hex.slice(1, 3), 16)
                            const g = parseInt(hex.slice(3, 5), 16)
                            const b = parseInt(hex.slice(5, 7), 16)
                            handleColorChange('--theme-accent-rgb', `${r}, ${g}, ${b}`)
                          }}
                          style={{ border: 'none', background: 'none', width: '40px', height: '40px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{currentColors['--theme-accent-color']}</span>
                      </div>
                    </div>

                    <div className="color-field">
                      <div>
                        <div style={{ fontSize: '13px', marginBottom: '2px' }}>Window color</div>
                        <div className="settings-muted">App windows and dialog surfaces</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="color" 
                          value={parseRgbaToHex(`rgb(${currentColors['--theme-window-color-rgb'] || '24, 28, 38'})`, '#202020')}
                          onChange={(e) => {
                            const hex = e.target.value
                            const r = parseInt(hex.slice(1, 3), 16)
                            const g = parseInt(hex.slice(3, 5), 16)
                            const b = parseInt(hex.slice(5, 7), 16)
                            handleColorChange('--theme-window-color-rgb', `${r}, ${g}, ${b}`)
                            const alpha = Number(currentColors['--theme-window-opacity'] || 0.76)
                            handleColorChange('--theme-bg-color', `rgba(${r}, ${g}, ${b}, ${alpha})`)
                          }}
                          style={{ border: 'none', background: 'none', width: '40px', height: '40px', cursor: 'pointer' }}
                        />
                        <span className="settings-muted">RGB only</span>
                      </div>
                    </div>

                    <div className="color-field">
                      <div>
                        <div style={{ fontSize: '13px', marginBottom: '2px' }}>Taskbar color</div>
                        <div className="settings-muted">Bottom bar tint and translucency</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="color" 
                          value={parseRgbaToHex(`rgb(${currentColors['--theme-taskbar-color-rgb'] || '11, 20, 36'})`, '#071836')}
                          onChange={(e) => {
                            const hex = e.target.value
                            const r = parseInt(hex.slice(1, 3), 16)
                            const g = parseInt(hex.slice(3, 5), 16)
                            const b = parseInt(hex.slice(5, 7), 16)
                            handleColorChange('--theme-taskbar-color-rgb', `${r}, ${g}, ${b}`)
                            const alpha = Number(currentColors['--theme-taskbar-opacity'] || 0.8)
                            handleColorChange('--theme-taskbar-bg', `rgba(${r}, ${g}, ${b}, ${alpha})`)
                          }}
                          style={{ border: 'none', background: 'none', width: '40px', height: '40px', cursor: 'pointer' }}
                        />
                        <span className="settings-muted">RGB only</span>
                      </div>
                    </div>

                    <div className="color-field">
                      <div>
                        <div style={{ fontSize: '13px', marginBottom: '2px' }}>Text color</div>
                        <div className="settings-muted">Labels and content text</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <input 
                          type="color" 
                          value={parseRgbaToHex(currentColors['--theme-text-color'], '#ffffff')}
                          onChange={(e) => handleColorChange('--theme-text-color', e.target.value)}
                          style={{ border: 'none', background: 'none', width: '40px', height: '40px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    <div className="color-field">
                      <div>
                        <div style={{ fontSize: '13px', marginBottom: '2px' }}>Window opacity</div>
                        <div className="settings-muted">How transparent app windows are</div>
                      </div>
                      <div style={{ width: 160 }}>
                        <input
                          type="range"
                          min="0.45"
                          max="0.95"
                          step="0.01"
                          value={currentColors['--theme-window-opacity'] || 0.76}
                          onChange={(e) => {
                            const value = Number(e.target.value)
                            handleColorChange('--theme-window-opacity', String(value))
                            const rgb = currentColors['--theme-window-color-rgb'] || '24, 28, 38'
                            handleColorChange('--theme-bg-color', `rgba(${rgb}, ${value})`)
                          }}
                          style={{ width: '100%', accentColor: 'var(--theme-accent-color)' }}
                        />
                      </div>
                    </div>

                    <div className="color-field">
                      <div>
                        <div style={{ fontSize: '13px', marginBottom: '2px' }}>Taskbar opacity</div>
                        <div className="settings-muted">Bottom bar transparency</div>
                      </div>
                      <div style={{ width: 160 }}>
                        <input
                          type="range"
                          min="0.55"
                          max="0.98"
                          step="0.01"
                          value={currentColors['--theme-taskbar-opacity'] || 0.8}
                          onChange={(e) => {
                            const value = Number(e.target.value)
                            handleColorChange('--theme-taskbar-opacity', String(value))
                            const rgb = currentColors['--theme-taskbar-color-rgb'] || '11, 20, 36'
                            handleColorChange('--theme-taskbar-bg', `rgba(${rgb}, ${value})`)
                          }}
                          style={{ width: '100%', accentColor: 'var(--theme-accent-color)' }}
                        />
                      </div>
                    </div>

                    <div className="color-field">
                      <div>
                        <div style={{ fontSize: '13px', marginBottom: '2px' }}>Window blur</div>
                        <div className="settings-muted">Back layer blur strength</div>
                      </div>
                      <div style={{ width: 160 }}>
                        <input
                          type="range"
                          min="8"
                          max="40"
                          step="1"
                          value={Number((currentColors['--theme-window-blur'] || '20px').replace('px', ''))}
                          onChange={(e) => handleColorChange('--theme-window-blur', `${e.target.value}px`)}
                          style={{ width: '100%', accentColor: 'var(--theme-accent-color)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {subPage.id === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="settings-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 400 }}>Notifications</div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>Get notifications from apps and senders</div>
                  </div>
                  <div 
                    onClick={() => setGlobalNotifications(!globalNotifications)}
                    style={{ 
                      width: '40px', height: '20px', 
                      background: globalNotifications ? 'var(--theme-accent-color)' : 'rgba(255,255,255,0.2)', 
                      borderRadius: '10px', position: 'relative', cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ 
                      width: '16px', height: '16px', background: '#fff', borderRadius: '50%', 
                      position: 'absolute', top: '2px', 
                      left: globalNotifications ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }}></div>
                  </div>
                </div>

                <div className="settings-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 400 }}>Do not disturb</div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>Send notifications directly to notification center</div>
                  </div>
                  <div 
                    onClick={() => setDndMode(!dndMode)}
                    style={{ 
                      width: '40px', height: '20px', 
                      background: dndMode ? 'var(--theme-accent-color)' : 'rgba(255,255,255,0.2)', 
                      borderRadius: '10px', position: 'relative', cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ 
                      width: '16px', height: '16px', background: '#fff', borderRadius: '50%', 
                      position: 'absolute', top: '2px', 
                      left: dndMode ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }}></div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '6px', fontWeight: 600 }}>Notifications from apps and other senders</div>
                
                <div className="settings-panel" style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px' }}>
                  {[
                    { id: 'snippingTool', label: 'Snipping Tool' },
                    { id: 'browser', label: 'Web Browser' },
                    { id: 'explorer', label: 'File Explorer' },
                    { id: 'system', label: 'System' }
                  ].map(app => (
                    <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span>{app.label}</span>
                      <div 
                        onClick={() => setAppNotifications(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                        style={{ 
                          width: '40px', height: '20px', 
                          background: appNotifications[app.id] && globalNotifications ? 'var(--theme-accent-color)' : 'rgba(255,255,255,0.2)', 
                          borderRadius: '10px', position: 'relative', cursor: globalNotifications ? 'pointer' : 'not-allowed',
                          opacity: globalNotifications ? 1 : 0.5,
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ 
                          width: '16px', height: '16px', background: '#fff', borderRadius: '50%', 
                          position: 'absolute', top: '2px', 
                          left: appNotifications[app.id] && globalNotifications ? '22px' : '2px',
                          transition: 'left 0.2s'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="main-page-container">
            <h1 className="settings-page-title">{navItems.find(i => i.id === activeTab)?.label}</h1>
            
            {activeTab === 'system' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                  onClick={() => setSubPage({ id: 'display', title: 'Display' })}
                  className="settings-panel"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <MdMonitor size={20} />
                      <div>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>Display</div>
                          <div style={{ fontSize: '12px', opacity: 0.6 }}>Brightness, night light, display profile</div>
                      </div>
                    </div>
                    <MdKeyboardArrowRight size={20} />
                </div>
                <div 
                  onClick={() => setSubPage({ id: 'sound', title: 'Sound' })}
                  className="settings-panel"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <MdVolumeUp size={20} />
                      <div>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>Sound</div>
                          <div style={{ fontSize: '12px', opacity: 0.6 }}>Volume levels, output devices</div>
                      </div>
                    </div>
                    <MdKeyboardArrowRight size={20} />
                </div>
                <div 
                  className="settings-panel settings-disabled-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.6 }}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <MdInfo size={20} />
                      <div>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>Power & battery</div>
                          <div style={{ fontSize: '12px' }}>Sleep, battery usage, battery saver</div>
                      </div>
                    </div>
                    <MdKeyboardArrowRight size={20} />
                    <span className="settings-admin-tooltip">Disabled by administrator</span>
                </div>
                <div 
                  className="settings-panel settings-disabled-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.6 }}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <MdInfo size={20} />
                      <div>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>Storage</div>
                          <div style={{ fontSize: '12px' }}>Storage space, drives, configuration rules</div>
                      </div>
                    </div>
                    <MdKeyboardArrowRight size={20} />
                    <span className="settings-admin-tooltip">Disabled by administrator</span>
                </div>
              </div>
            )}

            {activeTab === 'personalization' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                  onClick={() => setSubPage({ id: 'background', title: 'Background' })}
                  className="settings-panel"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <MdWallpaper size={20} />
                      <div>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>Background</div>
                          <div style={{ fontSize: '12px', opacity: 0.6 }}>Wallpaper, custom images</div>
                      </div>
                    </div>
                    <MdKeyboardArrowRight size={20} />
                </div>
                <div 
                  onClick={() => setSubPage({ id: 'themes', title: 'Themes & Colors' })}
                  className="settings-panel"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <MdColorLens size={20} />
                      <div>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>Themes & Colors</div>
                          <div style={{ fontSize: '12px', opacity: 0.6 }}>Themes, accent color, taskbar color</div>
                      </div>
                    </div>
                    <MdKeyboardArrowRight size={20} />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                  onClick={() => setSubPage({ id: 'notifications', title: 'Notifications' })}
                  className="settings-panel"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <MdNotifications size={20} />
                      <div>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>Notifications</div>
                          <div style={{ fontSize: '12px', opacity: 0.6 }}>Get notifications from apps and senders</div>
                      </div>
                    </div>
                    <MdKeyboardArrowRight size={20} />
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="settings-panel" style={{ padding: '24px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Device specifications</div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '13px' }}>
                    <div style={{ opacity: 0.6 }}>Device name</div>
                    <div>[REDACTED] PC</div>
                    <div style={{ opacity: 0.6 }}>Processor</div>
                    <div>AMD Ryzen 5 5600H with Radeon Graphics (3.30 GHz)</div>
                    <div style={{ opacity: 0.6 }}>Installed RAM</div>
                    <div>16.0 GB (15.7 GB usable)</div>
                    <div style={{ opacity: 0.6 }}>System type</div>
                    <div>64-bit operating system, x64-based processor</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
