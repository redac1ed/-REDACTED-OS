import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const RM_CRASH_COOKIE = 'os_rm_lock'

const hasRmCrashCookie = () =>
  document.cookie.split(';').some((c) => c.trim().startsWith(`${RM_CRASH_COOKIE}=`))

const setRmCrashCookie = () => {
  document.cookie = `${RM_CRASH_COOKIE}=1; path=/; max-age=31536000; samesite=lax`
}

export default function Terminal() {
  const [history, setHistory] = useState([
    { type: 'output', content: 'Microsoft Windows [Version 10.0.22621.1]' },
    { type: 'output', content: '(c) Microsoft Corporation. All rights reserved.' },
    { type: 'output', content: '\n' },
  ])
  const [currentLine, setCurrentLine] = useState('')
  const [isCrashed, setIsCrashed] = useState(() => hasRmCrashCookie())
  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const handleCommand = (cmd) => {
    if (cmd.trim() === 'rm -rf / --no-preserve-root') {
      setRmCrashCookie()
      setIsCrashed(true)
      return
    }
    const args = cmd.trim().split(' ')
    const command = args[0].toLowerCase()
    let output = ''
    switch (command) {
      case 'help':
        output = 'Available commands: help, clear, echo, time, ver'
        break
      case 'clear':
        setHistory([])
        return
      case 'echo':
        output = args.slice(1).join(' ')
        break
      case 'time':
        output = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
        break
      case 'ver':
        output = 'Microsoft Windows [Version 10.0.22671.1]'
        break
      case 'apt': case 'apt-get': case 'sudo': case 'mkdir': case 'rm': case 'rmdir': case 'ls': case 'cd': case 'pwd': case 'cat': case 'nano': case 'vi': case 'vim': case 'code':
        output = 'This is windows not linux. 😂🫵'
        break
      case 'curl': case 'wget': case 'fetch': case 'git': case 'npm': case 'yarn': case 'pip': case 'pip3':
        output = 'This is not a real PC. 😂🫵'
        break
      case '':
        break
      default:
        output = `'${command}' is not recognized as a command, program or batch file.`
    }
    setHistory(prev => [
      ...prev,
      { type: 'input', content: 'C:\\Desktop>' + cmd },
      ...(output ? [{ type: 'output', content: output }] : []),
      { type: 'output', content: '' }
    ])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(currentLine)
      setCurrentLine('')
    }
  }

  if (isCrashed) {
    return createPortal(
      <div className="mobile-blocker visible">
        <video
          src="/rm-rf-meme.mp4"
          autoPlay
          loop
          muted
          playsInline
          poster="/rm-meme.jpeg"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>,
      document.body
    )
  }

  return (
    <div className="terminal-app" style={{ 
      background: '#0c0c0c', 
      color: '#cccccc', 
      fontFamily: 'Consolas, monospace', 
      height: '100%', 
      padding: '4px',
      overflowY: 'auto',
      fontSize: '14px',
      lineHeight: '1.2'
    }} onClick={() => document.getElementById('term-input')?.focus()}>
      {history.map((line, i) => (
        <div key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: '2px' }}>
          {line.content}
        </div>
      ))}
      <div style={{ display: 'flex' }}>
        <span>C:\Desktop&gt;</span>
        <input
          id="term-input"
          type="text"
          value={currentLine}
          onChange={(e) => setCurrentLine(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            outline: 'none',
            flex: 1,
            marginLeft: '0px'
          }}
        />
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
