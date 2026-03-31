import { useState, useRef, useEffect } from 'react'
import { Minus, Square, X, Copy } from 'lucide-react'

function SnapHud({ activeZone }) {
  return (
    <div className="snap-layout-hud">
      {/* 50-50 */}
      <div className="snap-group group-50-50">
        <div className={`snap-zone left ${activeZone === 'split-2-left' ? 'active' : ''}`} data-snap-zone="split-2-left" />
        <div className={`snap-zone right ${activeZone === 'split-2-right' ? 'active' : ''}`} data-snap-zone="split-2-right" />
      </div>
      
      {/* 60-40 */}
      <div className="snap-group group-60-40">
        <div className={`snap-zone left ${activeZone === 'split-2-uneven-left' ? 'active' : ''}`} data-snap-zone="split-2-uneven-left" />
        <div className={`snap-zone right ${activeZone === 'split-2-uneven-right' ? 'active' : ''}`} data-snap-zone="split-2-uneven-right" />
      </div>
      
      {/* 3 Col */}
      <div className="snap-group group-3-col">
        <div className={`snap-zone left ${activeZone === 'split-3-left' ? 'active' : ''}`} data-snap-zone="split-3-left" />
        <div className={`snap-zone mid ${activeZone === 'split-3-mid' ? 'active' : ''}`} data-snap-zone="split-3-mid" />
        <div className={`snap-zone right ${activeZone === 'split-3-right' ? 'active' : ''}`} data-snap-zone="split-3-right" />
      </div>

       {/* Left Focus */}
      <div className="snap-group group-left-focus">
        <div className={`snap-zone left ${activeZone === 'left-focus-main' ? 'active' : ''}`} data-snap-zone="left-focus-main" />
        <div className="right-col">
           <div className={`snap-zone right-top ${activeZone === 'left-focus-top' ? 'active' : ''}`} data-snap-zone="left-focus-top" />
           <div className={`snap-zone right-btm ${activeZone === 'left-focus-btm' ? 'active' : ''}`} data-snap-zone="left-focus-btm" />
        </div>
      </div>
      
      {/* Grid */}
      <div className="snap-group group-grid">
         <div className={`snap-zone tl ${activeZone === 'grid-tl' ? 'active' : ''}`} data-snap-zone="grid-tl" />
         <div className={`snap-zone tr ${activeZone === 'grid-tr' ? 'active' : ''}`} data-snap-zone="grid-tr" />
         <div className={`snap-zone bl ${activeZone === 'grid-bl' ? 'active' : ''}`} data-snap-zone="grid-bl" />
         <div className={`snap-zone br ${activeZone === 'grid-br' ? 'active' : ''}`} data-snap-zone="grid-br" />
      </div>

      {/* Right Focus */}
      <div className="snap-group group-right-focus">
        <div className="left-col">
           <div className={`snap-zone left-top ${activeZone === 'right-focus-top' ? 'active' : ''}`} data-snap-zone="right-focus-top" />
           <div className={`snap-zone left-btm ${activeZone === 'right-focus-btm' ? 'active' : ''}`} data-snap-zone="right-focus-btm" />
        </div>
        <div className={`snap-zone right ${activeZone === 'right-focus-main' ? 'active' : ''}`} data-snap-zone="right-focus-main" />
      </div>
    </div>
  )
}

function Window({ window: win, onClose, onMinimize, onMaximize, onUpdatePos, onUpdateSize, onFocus, isFocused }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDir, setResizeDir] = useState(null)
  const [opened, setOpened] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showSnapHud, setShowSnapHud] = useState(false)
  const [hoverSnap, setHoverSnap] = useState(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0, wx: 0, wy: 0 })
  const closeTimerRef = useRef(null)
  const frameRef = useRef(null)
  const latestEventRef = useRef(null)
  useEffect(() => {
    const t = requestAnimationFrame(() => setOpened(true))
    return () => cancelAnimationFrame(t)
  }, [])
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const applySnapLayout = (zoneId) => {
    const W = window.innerWidth
    const H = window.innerHeight - 48
    const snap = (x, y, w, h) => {
       onUpdatePos(win.id, Math.floor(x), Math.floor(y))
       onUpdateSize(win.id, Math.floor(w), Math.floor(h))
    }
    switch(zoneId) {
      // 50-50
      case 'split-2-left': snap(0, 0, W/2, H); break;
      case 'split-2-right': snap(W/2, 0, W/2, H); break;
      
      // 60-40
      case 'split-2-uneven-left': snap(0, 0, W*0.65, H); break;
      case 'split-2-uneven-right': snap(W*0.65, 0, W*0.35, H); break;

      // 3 Col
      case 'split-3-left': snap(0, 0, W/3, H); break;
      case 'split-3-mid': snap(W/3, 0, W/3, H); break;
      case 'split-3-right': snap((W/3)*2, 0, W/3, H); break;

      // Left Focus
      case 'left-focus-main': snap(0, 0, W/2, H); break;
      case 'left-focus-top': snap(W/2, 0, W/2, H/2); break;
      case 'left-focus-btm': snap(W/2, H/2, W/2, H/2); break;

      // Grid
      case 'grid-tl': snap(0, 0, W/2, H/2); break;
      case 'grid-tr': snap(W/2, 0, W/2, H/2); break;
      case 'grid-bl': snap(0, H/2, W/2, H/2); break;
      case 'grid-br': snap(W/2, H/2, W/2, H/2); break;

      // Right Focus
      case 'right-focus-top': snap(0, 0, W/2, H/2); break;
      case 'right-focus-btm': snap(0, H/2, W/2, H/2); break;
      case 'right-focus-main': snap(W/2, 0, W/2, H); break;
    }
  }
  const handleTitleBarMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('.window-controls')) return
    e.preventDefault()
    onFocus(win.id)
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - win.x,
      y: e.clientY - win.y,
    }
  }
  const handleResizeStart = (e, direction) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    onFocus(win.id)
    setIsResizing(true)
    setResizeDir(direction)
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: win.width,
      h: win.height,
      wx: win.x,
      wy: win.y,
    }
  }
  const startClose = (e) => {
    e.stopPropagation()
    if (isClosing) return
    setIsClosing(true)
    setOpened(false)
    closeTimerRef.current = setTimeout(() => onClose(win.id), 220)
  }
  useEffect(() => {
    if (!isDragging && !isResizing) return
    const flushPointerUpdate = () => {
      frameRef.current = null
      const e = latestEventRef.current
      if (!e) return
      if (isDragging) {
        if (win.maximized) {
          onMaximize(win.id)
          dragStartRef.current = { x: win.width / 2, y: 17 }
        }
        const newX = e.clientX - dragStartRef.current.x
        const newY = e.clientY - dragStartRef.current.y
        onUpdatePos(win.id, Math.max(-100, newX), Math.max(0, newY))
        const el = document.elementFromPoint(e.clientX, e.clientY)
        const inHud = el?.closest('.snap-layout-hud')
        const zone = el?.closest('.snap-zone')
        if (!win.maximized && (e.clientY <= 24 || inHud)) {
           setShowSnapHud(true)
           if (zone) {
              setHoverSnap(zone.getAttribute('data-snap-zone'))
           } else {
              setHoverSnap(null)
           }
        } else {
           setShowSnapHud(false)
           setHoverSnap(null)
        }
      }
      if (isResizing && resizeDir) {
        const dx = e.clientX - resizeStartRef.current.x
        const dy = e.clientY - resizeStartRef.current.y
        let newW = resizeStartRef.current.w
        let newH = resizeStartRef.current.h
        let newX = resizeStartRef.current.wx
        let newY = resizeStartRef.current.wy
        if (resizeDir.includes('e')) newW = Math.max(320, resizeStartRef.current.w + dx)
        if (resizeDir.includes('s')) newH = Math.max(220, resizeStartRef.current.h + dy)
        if (resizeDir.includes('w')) {
          newW = Math.max(320, resizeStartRef.current.w - dx)
          newX = resizeStartRef.current.wx + resizeStartRef.current.w - newW
        }
        if (resizeDir.includes('n')) {
          newH = Math.max(220, resizeStartRef.current.h - dy)
          newY = resizeStartRef.current.wy + resizeStartRef.current.h - newH
        }
        onUpdateSize(win.id, newW, newH)
        onUpdatePos(win.id, Math.max(-100, newX), Math.max(0, newY))
      }
    }
    const handleMouseMoveGlobal = (e) => {
      e.preventDefault()
      latestEventRef.current = e
      if (!frameRef.current) frameRef.current = requestAnimationFrame(flushPointerUpdate)
    }
    const handleMouseUpGlobal = () => {
      if (isDragging && hoverSnap) {
        applySnapLayout(hoverSnap)
      }
      setIsDragging(false)
      setIsResizing(false)
      setResizeDir(null)
      setShowSnapHud(false)
      setHoverSnap(null)
    }
    document.addEventListener('mousemove', handleMouseMoveGlobal, { capture: true })
    document.addEventListener('mouseup', handleMouseUpGlobal, { capture: true })
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal, { capture: true })
      document.removeEventListener('mouseup', handleMouseUpGlobal, { capture: true })
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [isDragging, isResizing, resizeDir, hoverSnap, win.id, win.maximized, win.width, onUpdatePos, onUpdateSize, onMaximize])

  const isInteracting = isDragging || isResizing
  const style = win.maximized
    ? {
        top: 0,
        left: 0,
        width: '100vw',
        height: 'calc(100vh - 48px)',
        zIndex: win.zIndex || 100,
        borderRadius: 0,
      }
    : {
        top: 0,
        left: 0,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex || 100,
        transform: `translate3d(${win.x}px, ${win.y}px, 0)`,
      }

  return (
    <>
      <div
        className={`window-container ${opened ? 'open' : ''} ${win.minimized ? 'minimized' : ''} ${isInteracting ? 'interacting' : ''} ${isClosing ? 'closing' : ''}`}
        style={style}
      >
        <div
          className={`window ${isFocused ? 'focused' : 'unfocused'} ${win.maximized ? 'maximized' : ''}`}
          onMouseDown={() => {
            if (!isFocused) onFocus(win.id)
          }}
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <div className="window-titlebar" onMouseDown={handleTitleBarMouseDown} onDoubleClick={() => onMaximize(win.id)}>
        <span className="window-title">
          {win.icon && (
            <span className="window-title-icon">
              {typeof win.icon === 'string' && win.icon.startsWith('http') ? (
                <img src={win.icon} alt="" width={16} height={16} draggable="false" />
              ) : (
                win.icon
              )}
            </span>
          )}
          {win.title}
        </span>
        <div className="window-controls">
          <button className="win-ctrl minimize" onClick={(e) => { e.stopPropagation(); onMinimize(win.id) }} title="Minimize">
            <Minus size={20} strokeWidth={2} />
          </button>
          <button className="win-ctrl maximize" onClick={(e) => { e.stopPropagation(); onMaximize(win.id) }} title={win.maximized ? 'Restore' : 'Maximize'}>
            {win.maximized ? (
              <Copy size={15} strokeWidth={2} />
            ) : (
              <Square size={15} strokeWidth={2} />
            )}
          </button>
          <button className="win-ctrl close" onClick={startClose} title="Close">
            <X size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="window-content">
        {isInteracting && <div className="window-drag-overlay" />}
        {win.component && <win.component {...(win.appProps || {})} />}
      </div>
      {!win.maximized && (
        <>
          <div className="resize-handle resize-n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="resize-handle resize-w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="resize-handle resize-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="resize-handle resize-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="resize-handle resize-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
        </>
      )}
        </div>
      </div>

      {showSnapHud && isDragging && !win.maximized && (
        <SnapHud activeZone={hoverSnap} />
      )}
    </>
  )
}
export default function WindowManager({ windows, focusedId, onClose, onMinimize, onMaximize, onUpdatePos, onUpdateSize, onFocus }) {
  return (
    <div className="window-manager">
      {windows.map(win => (
        <Window
          key={win.id}
          window={win}
          isFocused={focusedId === win.id}
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
          onUpdatePos={onUpdatePos}
          onUpdateSize={onUpdateSize}
          onFocus={onFocus}
        />
      ))}
    </div>
  )
}