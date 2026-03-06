import { useRef, useState, useEffect } from 'react'
import {
  MdBrush, MdDelete, MdSave, MdClear, MdUndo, MdRedo,
  MdFormatColorFill, MdHorizontalRule, MdCropSquare,
  MdRadioButtonUnchecked, MdZoomIn, MdZoomOut,
} from 'react-icons/md'

const TOOLS = [
  { id: 'brush',  Icon: MdBrush,               label: 'Brush'  },
  { id: 'eraser', Icon: MdClear,               label: 'Eraser' },
  { id: 'line',   Icon: MdHorizontalRule,       label: 'Line'   },
  { id: 'rect',   Icon: MdCropSquare,           label: 'Rect'   },
  { id: 'circle', Icon: MdRadioButtonUnchecked, label: 'Circle' },
]

const PALETTE = [
  '#000000','#3c3c3c','#7f7f7f','#c0c0c0','#ffffff',
  '#d93025','#ff6d00','#f9ab00','#7cb342','#1a73e8',
  '#673ab7','#c2185b','#8d6e63','#00acc1','#f06292',
  '#4caf50','#e91e63','#ff9800','#ffeb3b','#26c6da',
]
export default function Paint() {
  const canvasRef   = useRef(null)
  const stageRef    = useRef(null)
  const snapshotRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color,     setColor]     = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [tool,      setTool]      = useState('brush')
  const [brushType, setBrushType] = useState('round')
  const [zoom,      setZoom]      = useState(100)
  const [startPt,   setStartPt]   = useState(null)
  const [pos,       setPos]       = useState({ x: 0, y: 0 })
  const [cSize,     setCSize]     = useState({ w: 0, h: 0 })

  const getPoint = (e) => {
    const c = canvasRef.current, r = c.getBoundingClientRect()
    return {
      x: Math.round((e.clientX - r.left) * (c.width  / r.width)),
      y: Math.round((e.clientY - r.top)  * (c.height / r.height)),
    }
  }

  const fill = (ctx, w, h) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h) }

  const applyBrush = (ctx) => {
    ctx.globalAlpha = brushType === 'marker' ? 0.35 : 1
    ctx.lineWidth   = brushType === 'marker' ? brushSize * 1.8 : brushSize
    ctx.lineCap     = brushType === 'square' ? 'butt'  : 'round'
    ctx.lineJoin    = brushType === 'square' ? 'miter' : 'round'
    ctx.strokeStyle = tool === 'eraser' ? '#fff' : color
  }

  const drawShape = (ctx, from, to) => {
    const w = to.x - from.x, h = to.y - from.y
    ctx.strokeStyle = color; ctx.lineWidth = brushSize
    ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath()
    if      (tool === 'line') { ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y) }
    else if (tool === 'rect') { ctx.rect(from.x, from.y, w, h) }
    else                      { ctx.arc(from.x, from.y, Math.hypot(w, h), 0, Math.PI * 2) }
    ctx.stroke()
  }

  useEffect(() => {
    const canvas = canvasRef.current, stage = stageRef.current
    if (!canvas || !stage) return
    const resize = () => {
      const snap = document.createElement('canvas')
      snap.width = canvas.width; snap.height = canvas.height
      snap.getContext('2d').drawImage(canvas, 0, 0)
      canvas.width  = Math.max(640, stage.clientWidth  - 2)
      canvas.height = Math.max(360, stage.clientHeight - 2)
      const ctx = canvas.getContext('2d')
      fill(ctx, canvas.width, canvas.height)
      if (snap.width) ctx.drawImage(snap, 0, 0)
      setCSize({ w: canvas.width, h: canvas.height })
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])

  const onDown = (e) => {
    const c = canvasRef.current, ctx = c.getContext('2d'), pt = getPoint(e)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setIsDrawing(true)
    if (tool === 'brush' || tool === 'eraser') {
      ctx.beginPath(); ctx.moveTo(pt.x, pt.y); applyBrush(ctx)
    } else {
      snapshotRef.current = ctx.getImageData(0, 0, c.width, c.height)
      setStartPt(pt)
    }
  }

  const onMove = (e) => {
    const pt = getPoint(e)
    setPos(pt)
    if (!isDrawing) return
    const ctx = canvasRef.current.getContext('2d')
    if (tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(pt.x, pt.y); applyBrush(ctx); ctx.stroke()
    } else if (startPt && snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0)
      drawShape(ctx, startPt, pt)
    }
  }

  const onUp = () => { setIsDrawing(false); setStartPt(null); snapshotRef.current = null }

  const clearCanvas = () => {
    const c = canvasRef.current; fill(c.getContext('2d'), c.width, c.height)
  }

  const saveImage = () => {
    const a = Object.assign(document.createElement('a'), {
      download: 'drawing.png', href: canvasRef.current.toDataURL(),
    })
    a.click()
  }
  return (
    <div className="paint-app">
      {/* menubar */}
      <div className="paint-menubar">
        <div className="paint-menu-left">
          {['File','Edit','View'].map(t => (
            <button key={t} className={`menu-tab${t==='File'?' active':''}`}>{t}</button>
          ))}
        </div>
        <div className="paint-menu-right">
          <button className="icon-ghost" title="Undo"><MdUndo size={17}/></button>
          <button className="icon-ghost" title="Redo"><MdRedo size={17}/></button>
        </div>
      </div>

      {/* ribbon */}
      <div className="paint-toolbar">
        <div className="paint-group size-group">
          <label className="slider-row">
            <span className="ribbon-label">Size</span>
            <input type="range" min="1" max="50" value={brushSize}
              onChange={e => setBrushSize(+e.target.value)} />
            <span className="size-badge">{brushSize}px</span>
          </label>
          <select className="compact-select" value={brushType}
            onChange={e => setBrushType(e.target.value)} disabled={tool !== 'brush'}>
            <option value="round">Round</option>
            <option value="square">Square</option>
            <option value="marker">Marker</option>
          </select>
          <div className="group-title">Brushes</div>
        </div>

        <div className="paint-group color-group">
          <div className="active-color-block" style={{ background: color }} />
          <div className="palette-grid">
            {PALETTE.map(s => (
              <button key={s} className={`palette-dot${color===s?' active':''}`}
                style={{ background: s }} onClick={() => setColor(s)} title={s} />
            ))}
          </div>
          <label className="custom-color" title="Custom colour">
            <MdFormatColorFill size={14}/>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} />
          </label>
          <div className="group-title">Colours</div>
        </div>

        <div className="paint-group action-group">
          <div className="zoom-control">
            <button className="icon-ghost sm" onClick={() => setZoom(z => Math.max(25,z-25))} title="Zoom out"><MdZoomOut size={15}/></button>
            <span className="zoom-label">{zoom}%</span>
            <button className="icon-ghost sm" onClick={() => setZoom(z => Math.min(400,z+25))} title="Zoom in"><MdZoomIn size={15}/></button>
          </div>
          <button className="action-btn" onClick={clearCanvas}><MdDelete size={15}/> Clear</button>
          <button className="action-btn accent" onClick={saveImage}><MdSave size={15}/> Save</button>
          <div className="group-title">Actions</div>
        </div>
      </div>

      {/* body: sidebar + canvas */}
      <div className="paint-body">
        <div className="paint-sidebar">
          {TOOLS.map(({ id, Icon, label }) => (
            <button key={id} className={`side-tool-btn${tool===id?' active':''}`}
              onClick={() => setTool(id)} title={label}>
              <Icon size={19}/>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="paint-stage" ref={stageRef}>
          <canvas ref={canvasRef}
            style={cSize.w ? { width: Math.round(cSize.w * zoom / 100), height: Math.round(cSize.h * zoom / 100) } : {}}
            onPointerDown={onDown} onPointerMove={onMove}
            onPointerUp={onUp}    onPointerLeave={onUp}
            className="paint-canvas" />
        </div>
      </div>

      {/* status bar */}
      <div className="paint-statusbar">
        <span>{pos.x}, {pos.y} px</span>
        <div className="status-sep"/>
        <span>{cSize.w} × {cSize.h}</span>
        <div className="status-sep"/>
        <span>Zoom: {zoom}%</span>
      </div>
    </div>
  )
}