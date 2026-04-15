import { useState, useEffect, useRef } from 'react'
import { LuWifi, LuWifiHigh, LuWifiLow, LuWifiOff } from "react-icons/lu";
import { BsBatteryCharging, BsBatteryHalf, BsBatteryFull } from "react-icons/bs";
import { IoVolumeLow, IoVolumeMedium, IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { useUser } from '../contexts/UserContext';  

const SYS_TRAY_ICON_SIZE = 20
const SysWifi = ({ level }) => {
  switch (level) {
    case 'off':
      return <LuWifiOff size={SYS_TRAY_ICON_SIZE} />;
    case 'zero':
      return <LuWifiLow size={SYS_TRAY_ICON_SIZE} />;
    case 'low':
      return <LuWifiHigh size={SYS_TRAY_ICON_SIZE} />;
    case 'high':
      return <LuWifi size={SYS_TRAY_ICON_SIZE} />;
    default:
      return <LuWifi size={SYS_TRAY_ICON_SIZE} />;
  }
}
const SysVolume = ({ volume }) => {
  const level = volume === 0 ? 0 : volume < 33 ? 1 : volume < 66 ? 2 : 3;
  const prevLevelRef = useRef(level);
  const [animClass, setAnimClass] = useState('');
  useEffect(() => {
    if (level > prevLevelRef.current) {
      setAnimClass('vol-slide-left');
    } else if (level < prevLevelRef.current) {
      setAnimClass('vol-slide-right');
    }
    prevLevelRef.current = level;
  }, [level]);
  let Icon = IoVolumeHigh;
  if (volume === 0) Icon = IoVolumeMute;
  else if (volume < 33) Icon = IoVolumeLow;
  else if (volume < 66) Icon = IoVolumeMedium;  
  return (
    <div 
      className={`system-tray-item ${animClass}`} 
      onAnimationEnd={() => setAnimClass('')}
    >
      <Icon size={SYS_TRAY_ICON_SIZE} />
    </div>
  );
}
const SysBattery = ({ charging, level }) => {
  const safeLevel = Math.max(0, Math.min(100, Number(level) || 0))
  if (charging) return <BsBatteryCharging size={SYS_TRAY_ICON_SIZE} style={{ color: '#86efac' }} />
  if (safeLevel > 80) return <BsBatteryFull size={SYS_TRAY_ICON_SIZE} />
  return (
    <BsBatteryHalf 
      size={SYS_TRAY_ICON_SIZE} 
      style={{ 
        color: safeLevel <= 15 ? '#f87171' : safeLevel <= 35 ? '#fbbf24' : 'currentColor' 
      }} 
    />
  )
}
export default function Taskbar({
  onStartClick,
  onQuickSettingsClick,
  onCalendarClick,
  windows,
  onWindowClick,
  focusedId,
  pinnedApps = [],
  onTogglePin = () => {},
  onLaunchApp = () => {},
  onShowDesktop = () => {},
  onReorderPinned = () => {},
}) {
  const [battery, setBattery] = useState(null)
  const [time, setTime] = useState(new Date())
  const [wifiName, setWifiName] = useState('WiFi')
  const [draggedApp, setDraggedApp] = useState(null)
  const [hoveredAppKey, setHoveredAppKey] = useState(null)
  const [delayedHoveredKey, setDelayedHoveredKey] = useState(null)
  const hoverTimeoutRef = useRef(null)
  const [wifiLevel, setWifiLevel] = useState('high') 
  const {volume} = useUser()
  const wasOnlineRef = useRef(navigator.onLine)
  const getWifiLevelFromConnection = () => {
    if (!navigator.onLine) return 'off'
    const conn = navigator.connection
    if (!conn) return 'high'
    const downlink = conn.downlink ?? 0
    if (downlink < 1) return 'zero'
    if (downlink < 5) return 'low'
    if (downlink < 20) return 'high'
    return 'full'
  }
  const runWifiStartupSequence = async (finalLevel) => {
    const seq = ['zero', 'low', 'high', 'full']
    for (const step of seq) {
      setWifiLevel(step)
      await new Promise((r) => setTimeout(r, 140))
    }
    setWifiLevel(finalLevel)
  }
  useEffect(() => {
    if ('connection' in navigator) {
      const conn = navigator.connection;
        if(conn.type === 'wifi') {
          setWifiName('WiFi'); 
        } else if(conn.type === 'cellular') {
          setWifiName('Cellular');
        } else if (conn.type === 'ethernet') {
          setWifiName('Ethernet');
        } else {
         setWifiName('Connected');
      }
      const updateConnection = async () => {
        if (!navigator.onLine) {
          setWifiName('No Internet')
          setWifiLevel('off')
          wasOnlineRef.current = false
          return
        }
        setWifiName('Connected')
        const finalLevel = getWifiLevelFromConnection()
        if (!wasOnlineRef.current) {
          await runWifiStartupSequence(finalLevel) 
        } else {
          setWifiLevel(finalLevel)
        }
        wasOnlineRef.current = true
      }
       conn.addEventListener('change', updateConnection);
       window.addEventListener('online', updateConnection);
       window.addEventListener('offline', updateConnection);
       return () => {
         conn.removeEventListener('change', updateConnection);
         window.removeEventListener('online', updateConnection);
         window.removeEventListener('offline', updateConnection);
       }
    } else {
        const updateOnlineStatus = () => setWifiName(navigator.onLine ? 'Connected' : 'No Internet');
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        }
    }
  }, [])
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!('getBattery' in navigator)) return
    navigator.getBattery().then((bat) => {
      const update = () =>
        setBattery({ level: Math.round(bat.level * 100), charging: bat.charging })
      update()
      bat.addEventListener('levelchange', update)
      bat.addEventListener('chargingchange', update)
      return () => {
        bat.removeEventListener('levelchange', update)
        bat.removeEventListener('chargingchange', update)
      }
    })
  }, [])
  const shortTime = time.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: false })
  const shortDate = time.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })
  const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, win: null })
  const [hoveredRightKey, setHoveredRightKey] = useState(null)
  const getAppHoverStyle = (key) =>
    hoveredAppKey === key
      ? {
          background: 'rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }
      : undefined
  const renderHoverOverlay = (label, key) => (
    <>
      <style>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div
        className='taskbar-hover-overlay'
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'calc(100% + 18px)',
          background: 'rgba(20, 20, 24, 0.96)',
          color: '#fff',
          padding: '5px 10px',
          borderRadius: '6px',
          fontSize: '15px',
          whiteSpace: 'nowrap',
          zIndex: 20000,
          pointerEvents: 'none',
          animation: 'fadeInSlideUp 0.15s ease-out forwards',
        }}
      >
        {label}
      </div>
    </>
  )
  const handleContext = (e, winOrPinned) => {
    e.preventDefault()
    setCtxMenu({ open: true, x: e.clientX, y: e.clientY, win: winOrPinned })
  }
  const closeCtx = () => setCtxMenu({ open: false, x: 0, y: 0, win: null })
  useEffect(() => {
    if (!ctxMenu.open) return
    const handler = () => closeCtx()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [ctxMenu.open])
  const pinnedIds = new Set(pinnedApps.map((p) => p.id))
  const unpinnedWindows = windows.filter((w) => !pinnedIds.has(w.appId))
  
  return (
    <>
      <div className="taskbar" onMouseDown={(e) => e.stopPropagation()}>
        <div className="taskbar-center">
          <button className="start-button" onClick={onStartClick}
            style={{ position: 'relative' }}
            onMouseEnter={() => {
              hoverTimeoutRef.current = setTimeout(() => setDelayedHoveredKey('start'), 300);
            }}
            onMouseLeave={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
              setDelayedHoveredKey(null);
            }}
          >
            <img src="/icons/windows-11.png" alt="Windows"/>
            {delayedHoveredKey === 'start' && renderHoverOverlay('Start', 'start')}
          </button>
          <div className="taskbar-icons" style={{ display: 'flex' }}>
            {pinnedApps.map((app) => {
              const openWin = windows.find((w) => w.appId === app.id)
              const hasWindow = !!openWin  
              const isActive = openWin && openWin.id === focusedId && !openWin.minimized
              return (
                <button
                  key={`pin-${app.id}`}
                  className={`taskbar-btn taskbar-app ${isActive ? 'active' : ''} ${hasWindow ? 'has-window' : ''} ${hoveredAppKey === `pin-${app.id}` ? 'is-hovered' : ''}`}
                  style={getAppHoverStyle(`pin-${app.id}`)}
                  onClick={() => {
                    if (openWin) {
                      onWindowClick(openWin.id)
                    } else {
                      onLaunchApp(app)
                    }
                  }}
                  onMouseEnter={() => {
                    setHoveredAppKey(`pin-${app.id}`);
                    hoverTimeoutRef.current = setTimeout(() => setDelayedHoveredKey(`pin-${app.id}`), 300);
                  }}
                  onMouseLeave={() => {
                    setHoveredAppKey((prev) => (prev === `pin-${app.id}` ? null : prev));
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                    setDelayedHoveredKey(null);
                  }}
                  onContextMenu={(e) => handleContext(e, app)}
                  aria-label={app.name}
                  draggable
                  onDragStart={() => setDraggedApp(app)}
                  onDragEnd={() => {
                    setHoveredAppKey(null);
                    setDelayedHoveredKey(null);
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedApp && draggedApp.id !== app.id) {
                       const newPinned = [...pinnedApps]
                       const fromIndex = newPinned.findIndex(p => p.id === draggedApp.id)
                       const toIndex = newPinned.findIndex(p => p.id === app.id)
                       if (fromIndex !== -1 && toIndex !== -1) {
                         newPinned.splice(fromIndex, 1)
                         newPinned.splice(toIndex, 0, draggedApp)
                         onReorderPinned(newPinned)
                       }
                    }
                    setDraggedApp(null)
                  }}
                >
                  <div className="taskbar-app-icon">
                    {app.icon ? <img src={app.icon} alt={app.name} /> : app.name[0]}
                  </div>
                  {delayedHoveredKey === `pin-${app.id}` && renderHoverOverlay(app.name, `pin-${app.id}`)}
                  {openWin && <div className="taskbar-indicator" />}
                </button>
              )
            })}
            {unpinnedWindows.map((win) => {
              const isActive = win.id === focusedId
              return (
                <button
                  key={`win-${win.id}`}
                  className={`taskbar-btn taskbar-app has-window ${isActive ? 'active' : ''} ${win.minimized ? 'minimized' : ''} ${hoveredAppKey === `win-${win.id}` ? 'is-hovered' : ''}`}
                  style={getAppHoverStyle(`win-${win.id}`)}
                  onClick={() => onWindowClick(win.id)}
                  onMouseEnter={() => {
                    setHoveredAppKey(`win-${win.id}`);
                    hoverTimeoutRef.current = setTimeout(() => setDelayedHoveredKey(`win-${win.id}`), 300);
                  }}
                  onMouseLeave={() => {
                    setHoveredAppKey((prev) => (prev === `win-${win.id}` ? null : prev));
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                    setDelayedHoveredKey(null);
                  }}
                  onContextMenu={(e) => handleContext(e, win)}
                  aria-label={win.title}
                >
                  <div className="taskbar-app-icon">
                    {win.icon ? (
                      <img src={win.icon} alt={win.title} />
                    ) : (
                      <span style={{ fontSize: '16px' }}>⌘</span>
                    )}
                  </div>
                  {delayedHoveredKey === `win-${win.id}` && renderHoverOverlay(win.title, `win-${win.id}`)}
                  <div className="taskbar-indicator" />
                </button>
              )
            })}
          </div>
        </div>
        <div className="taskbar-right">
          <div
            className="system-tray-container"
            onClick={onQuickSettingsClick}
            onMouseEnter={() => setHoveredRightKey('tray')}
            onMouseLeave={() => setHoveredRightKey((prev) => (prev === 'tray' ? null : prev))}
            style={{
              position: 'relative',
              ...(hoveredRightKey === 'tray'
                ? { background: 'rgba(255, 255, 255, 0.08)', boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)' }
                : {}),
            }}
          >
            <div className="system-tray-item"><SysWifi level={wifiLevel} /></div>
            <SysVolume volume={volume}/>
            <div className="system-tray-item"><SysBattery charging={battery?.charging} level={battery?.level ?? 100} /></div>
          </div>
          <div
            className="taskbar-clock"
            onClick={onCalendarClick}
            aria-label="Calendar"
            onMouseEnter={() => {
              setHoveredRightKey('clock');
              hoverTimeoutRef.current = setTimeout(() => setDelayedHoveredKey('clock'), 300);
            }}
            onMouseLeave={() => {
              setHoveredRightKey((prev) => (prev === 'clock' ? null : prev));
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
              setDelayedHoveredKey(null);
            }}
            style={{
              position: 'relative',
              ...(hoveredRightKey === 'clock'
                ? { background: 'rgba(255, 255, 255, 0.08)', boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)' }
                : {}),
            }}
          >
            <span className="tb-time">{shortTime}</span>
            <span className="tb-date">{shortDate}</span>
            {delayedHoveredKey === 'clock' && renderHoverOverlay('Calendar', 'clock')}
          </div>
          <div
            className="tb-show-desktop"
            onClick={onShowDesktop}
            aria-label="Show desktop"
            onMouseEnter={() => {
              setHoveredRightKey('desktop');
              hoverTimeoutRef.current = setTimeout(() => setDelayedHoveredKey('desktop'), 300);
            }}
            onMouseLeave={() => {
              setHoveredRightKey((prev) => (prev === 'desktop' ? null : prev));
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
              setDelayedHoveredKey(null);
            }}
            style={{ position: 'relative' }}
          >
            {delayedHoveredKey === 'desktop' && renderHoverOverlay('Show desktop', 'desktop')}
          </div>
        </div>
      </div>
      {ctxMenu.open && (
        <div
          className="context-menu"
          style={{ left: ctxMenu.x, bottom: 56 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="ctx-item"
            onClick={() => {
              if (ctxMenu.win) onTogglePin(ctxMenu.win)
              closeCtx()
            }}
          >
            {ctxMenu.win && pinnedApps.find((p) => p.id === ctxMenu.win.id)
              ? 'Unpin from taskbar'
              : 'Pin to taskbar'}
          </div>
          {ctxMenu.win && windows.some(w => w.appId === ctxMenu.win.id || w.id === ctxMenu.win.id) && (
            <div className="ctx-item" onClick={() => closeCtx()}>Close window</div>
          )}
        </div>
      )}
    </>
  )
}
