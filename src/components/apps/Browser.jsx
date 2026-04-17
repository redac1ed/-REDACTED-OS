import { useState, useEffect, useRef, useCallback } from "react"
import { Clock3, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react'

export default function Browser() {
  const [iframeUrl, setIframeUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('https://google.com')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [searchHistory, setSearchHistory] = useState([])
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false)
  const searchUiRef = useRef(null)
  const iframeRef = useRef(null)
  const lastProxiedUrlRef = useRef('')
  const SEARCH_HISTORY_KEY = 'browser-search-history-v1'
  const MAX_SEARCH_HISTORY = 8

  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved).slice(0, MAX_SEARCH_HISTORY))
      } catch (e) {
        console.error('Failed to load search history:', e)
      }
    }
  }, [])
  useEffect(() => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory))
  }, [searchHistory])
  const saveSearchHistory = useCallback((term) => {
    if (!term.trim()) return
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== term)
      return [term, ...filtered].slice(0, MAX_SEARCH_HISTORY)
    })
  }, [])
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([])
  }, [])
  const isValidUrl = (string) => {
    if (string.includes(' ')) return false
    try {
      const url = new URL(string.startsWith('http') ? string : `https://${string}`)
      return url.hostname.includes('.') || url.hostname === 'localhost'
    } catch (_) {
      return false
    }
  }
  const handleSubmit = async (url = inputUrl) => {
    setLoading(true)
    setIsSearchDropdownOpen(false)
    try {
      let targetUrl
      if (isValidUrl(url)) {
        targetUrl = url.startsWith('http') ? url : `https://${url}`
        saveSearchHistory(targetUrl)
      } else {
        targetUrl = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`
        saveSearchHistory(url)
      }
      const normalizedTarget = new URL(targetUrl).toString()
      const response = await fetch(`/api/api?url=${encodeURIComponent(normalizedTarget)}`)
      const data = await response.json()
      const proxiedUrl = data.url || data.streamingUrls?.[0]?.url
      if (proxiedUrl) {
        lastProxiedUrlRef.current = proxiedUrl
        setIframeUrl(proxiedUrl)
        const newHistory = history.slice(0, currentIndex + 1)
        newHistory.push({ original: targetUrl, proxied: proxiedUrl })
        setHistory(newHistory)
        setCurrentIndex(newHistory.length - 1)
      } else {
        console.error("No url field in response:", data)
      }
    } catch (error) {
      console.error("Error fetching URL:", error)
    }
    setLoading(false)
  }
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current && iframeRef.current.src) {
      lastProxiedUrlRef.current = iframeRef.current.src
    }
  }, [])
  const handleBack = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setIframeUrl(history[newIndex].proxied)
      setInputUrl(history[newIndex].original)
    }
  }
  const handleForward = () => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      setIframeUrl(history[newIndex].proxied)
      setInputUrl(history[newIndex].original)
    }
  }
  const handleReload = () => {
    if (currentIndex >= 0) {
      handleSubmit(history[currentIndex].original)
    }
  }
  const handleSearchSuggestion = (item) => {
    setInputUrl(item)
    setIsSearchDropdownOpen(false)
    handleSubmit(item)
  }
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchUiRef.current && !searchUiRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="chrome-app" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1e1e1e', color: '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', backgroundColor: '#2b2b2b', borderBottom: '1px solid #404040', gap: '4px' }}>
        <button onClick={handleBack} disabled={currentIndex <= 0} style={{ padding: '4px', margin: 0, background: 'none', border: 'none', cursor: currentIndex > 0 ? 'pointer' : 'not-allowed', color: currentIndex > 0 ? '#e8eaed' : '#5f6368', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
          <ArrowLeft size={20} />
        </button>
        <button onClick={handleForward} disabled={currentIndex >= history.length - 1} style={{ padding: '4px', margin: 0, background: 'none', border: 'none', cursor: currentIndex < history.length - 1 ? 'pointer' : 'not-allowed', color: currentIndex < history.length - 1 ? '#e8eaed' : '#5f6368', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
          <ArrowRight size={20} />
        </button>
        <button onClick={handleReload} disabled={!iframeUrl || loading} style={{ padding: '4px', margin: 0, background: 'none', border: 'none', cursor: (!iframeUrl || loading) ? 'not-allowed' : 'pointer', color: (!iframeUrl || loading) ? '#5f6368' : '#e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
          <RotateCw size={20} />
        </button>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="mp-search-form" ref={searchUiRef} style={{ flex: 1, margin: 0, marginLeft: '8px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onFocus={() => setIsSearchDropdownOpen(true)}
            style={{ width: '100%', padding: '8px 16px', border: 'none', borderRadius: '24px', outline: 'none', fontSize: '14px', backgroundColor: '#3c3c3c', color: '#e8eaed', height: '34px', boxSizing: 'border-box' }}
            placeholder="Search typing..."
          />
          {isSearchDropdownOpen && (
            <div className="mp-search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#2b2b2b', border: '1px solid #404040', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 10, maxHeight: '300px', overflowY: 'auto' }}>
              <div className="mp-search-head" style={{ padding: '8px 12px', borderBottom: '1px solid #404040', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff' }}>
                <span>Recent searches</span>
                {searchHistory.length > 0 && (
                  <button type="button" className="mp-search-clear" onClick={clearSearchHistory} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                    Clear
                  </button>
                )}
              </div>
              {searchHistory.length === 0 && (
                <div className="mp-search-hint" style={{ padding: '8px 12px', color: '#999999' }}>No search history yet</div>
              )}
              {searchHistory.map((item) => (
                <button
                  type="button"
                  key={`history-${item}`}
                  className="mp-search-item"
                  onClick={() => handleSearchSuggestion(item)}
                  style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}
                >
                  <span className="mp-search-item-clock"><Clock3 size={14} color="#ffffff" /></span>
                  <span>{item}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
      <div className="chrome-content" style={{ flex: 1, position: 'relative', backgroundColor: '#1e1e1e' }}>
        {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, color: '#ffffff' }}>Loading...</div>}
        <iframe
          ref={iframeRef}
          src={iframeUrl || undefined}
          onLoad={handleIframeLoad}
          title="Browser Content"
          referrerPolicy="no-referrer"
          allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; display-capture; camera; microphone; fullscreen; storage-access"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
