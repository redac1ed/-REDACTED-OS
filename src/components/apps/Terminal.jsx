import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

export default function Terminal() {
  const hostRef = useRef(null)
  const emulatorRef = useRef(null)
  const termRef = useRef(null)
  const fitRef = useRef(null)
  const dataDisposableRef = useRef(null)
  const resizeHandlerRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const bootedRef = useRef(false)
  const [status, setStatus] = useState('Loading emulator...')
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    let cancelled = false
    let scriptEl = null
    const loadScript = () =>
      new Promise((resolve, reject) => {
        if (window.V86) return resolve()
        const s = document.createElement('script')
        s.src = '/v86/libv86.js'
        s.onload = resolve
        s.onerror = reject
        document.body.appendChild(s)
        scriptEl = s
      })
    const boot = async () => {
      try {
        await loadScript()
        if (cancelled || !hostRef.current) return
        hostRef.current.innerHTML = ''
        setStatus('Booting Linux...')
        const term = new XTerm({
          cursorBlink: true,
          convertEol: true,
          fontSize: 14,
          fontFamily: '"JetBrains Mono", Consolas, "Courier New", monospace',
          theme: {
            background: '#000000',
            foreground: '#d4d4d4',
          },
          scrollback: 5000,
        })
        term.attachCustomKeyEventHandler((event) => {
          if (event.type === 'keydown' && event.ctrlKey && event.shiftKey) {
            if (event.key === 'C' || event.code === 'KeyC') {
              const selection = term.getSelection()
              if (selection) {
                navigator.clipboard.writeText(selection).catch(err => {
                  console.error('Copy failed:', err)
                })
              }
              event.preventDefault()
              return false
            }
            if (event.key === 'V' || event.code === 'KeyV') { 
              navigator.clipboard.readText().then(text => {
                term.paste(text)
              }).catch(err => {
                console.error('Paste failed:', err)
              })
              event.preventDefault()
              return false
            }
          }
          return true
        })
        const fit = new FitAddon()
        term.loadAddon(fit)
        term.open(hostRef.current)
        fit.fit()
        term.focus()
        const emu = new window.V86({
          wasm_path: '/v86/v86.wasm',
          bios: { url: '/v86/bios/seabios.bin' },
          vga_bios: { url: '/v86/bios/vgabios.bin' },
          bzimage: { url: '/v86/images/buildroot-bzimage68.bin' },
          cmdline: 'console=ttyS0 tsc=reliable mitigations=off random.trust_cpu=on',
          autostart: true,
          memory_size: 128 * 1024 * 1024,
          vga_memory_size: 8 * 1024 * 1024,
          disable_speaker: true,
          disable_mouse: true,
          disable_keyboard: true,
          enable_rtl8139: true,
        })
        dataDisposableRef.current = term.onData((data) => {
          emu.serial0_send(data)
        })
        emu.add_listener('serial0-output-byte', (byte) => {
          term.write(Uint8Array.of(byte))
        })
        const onResize = () => fit.fit()
        window.addEventListener('resize', onResize)
        resizeHandlerRef.current = onResize
        const resizeObserver = new ResizeObserver(() => {
          fit.fit()
        })
        resizeObserver.observe(hostRef.current)
        resizeObserverRef.current = resizeObserver
        
        emulatorRef.current = emu
        termRef.current = term
        fitRef.current = fit
        setStatus('')
      } catch (error) {
        setStatus(`Failed to load emulator: ${error.message}`)
      }
    }
    boot()

    return () => {
      cancelled = true
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current)
        resizeHandlerRef.current = null
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
      dataDisposableRef.current?.dispose?.()
      dataDisposableRef.current = null
      emulatorRef.current?.destroy?.()
      emulatorRef.current = null
      termRef.current?.dispose?.()
      termRef.current = null
      fitRef.current = null
      if (hostRef.current) {
        hostRef.current.innerHTML = ''
      }
      if (scriptEl?.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl)
      }
      bootedRef.current = false
    }
  }, [])

  return (
  <div style={{ 
    height: '100%', 
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0c0c0c', 
    color: '#ccc', 
    overflow: 'hidden',
    boxSizing: 'border-box'
  }}>
    {status && <div style={{ marginBottom: 8, paddingLeft: 8, paddingRight: 8 }}>{status}</div>}
    <div ref={hostRef} style={{ flex: 1, width: '100%', overflow: 'hidden' }} />
  </div>
)
}