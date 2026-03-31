import { useState, useEffect, useCallback } from 'react'
import { MdLocationOn } from 'react-icons/md'
import { Icon } from '@iconify/react'
function formatClock(d) {
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}
function formatDate(d) {
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}
function getWeatherIcon(code) {
  if (code === 0) return 'meteocons:clear-day'
  if ([1, 2, 3].includes(code)) return 'meteocons:overcast'
  if ([45, 48].includes(code)) return 'meteocons:fog'
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'meteocons:rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'meteocons:snow'
  if ([95, 96, 99].includes(code)) return 'meteocons:thunderstorms'
  return 'meteocons:clear-day-fill'
}
function WeatherCard() {
  const [temp, setTemp] = useState('--')
  const [wind, setWind] = useState('--')
  const [label, setLabel] = useState('Loading...')
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState(null)
  const WeatherIcon = getWeatherIcon(code)
  const [iconTick, setIconTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIconTick(t => t + 1), 15000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    let dead = false
    const fetchWeather = async (lat, lon) => {
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`)
        const d = await r.json()
        if (dead) return
        setTemp(Math.round(d?.current?.temperature_2m ?? 0))
        setWind(Math.round(d?.current?.wind_speed_10m ?? 0))
        const c = d?.current?.weather_code
        setCode(c)
        setLabel(c === 0 ? 'Clear' : [1, 2, 3].includes(c) ? 'Cloudy' : [45, 48].includes(c) ? 'Fog' : [95, 96, 99].includes(c) ? 'Storm' : 'Weather')
      } catch {
        if (!dead) setLabel('Unavailable')
      } finally {
        if (!dead) setLoading(false)
      }
    }
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => fetchWeather(coords.latitude, coords.longitude)
    ) 
    return () => {
      dead = true
    }
  }, [])

  return (
    <div className="w11-card">
      <div className="w11-card-header">
        <MdLocationOn size={14} />
        {loading ? 'Locating...' : 'Weather'}
      </div>
      <div className="w11-card-content">
        <div className="w11-weather-simplified">
          <Icon key={iconTick} className="w11-icon" icon={WeatherIcon} width="48" height="48" />
          <div className="w11-weather-info">
            <span className="w11-weather-degree">{temp}°F</span>
            <span className="w11-weather-label">{label} • {wind} mph</span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default function LockScreen({ onUnlock, unlocking }) {
  const [time, setTime] = useState(new Date())
  const [showCards, setShowCards] = useState(false)
  const [isFullyUnlocked, setIsFullyUnlocked] = useState(false)
  useEffect(() => {
    if (unlocking === 'desktop') {
      const timer = setTimeout(() => setIsFullyUnlocked(true), 650)
      return () => clearTimeout(timer)
    }
  }, [unlocking])
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    const id = setTimeout(() => setShowCards(true), 600)
    return () => clearTimeout(id)
  }, [])
  const handleUnlock = useCallback(() => {
    if (onUnlock && !unlocking) onUnlock()
  }, [onUnlock, unlocking])
  useEffect(() => {
    const onKey = (e) => { 
      if (e.key !== 'Escape' && !unlocking) handleUnlock() 
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUnlock, unlocking])
  if (isFullyUnlocked) return null
  return (
    <div
      className={`w11-lock ${unlocking === true ? 'w11-blurred' : ''} ${unlocking === 'desktop' ? 'w11-lock--out' : ''}`}
      onClick={handleUnlock}
      role="button"
      tabIndex={0}
      aria-label="Lock screen"
    >
      <div 
        className="w11-lock-bg-container" 
        style={{ backgroundImage: 'var(--desktop-bg)' }}
        aria-hidden="true" 
      />
      <div className="w11-clock-area">
        <div className="w11-time"><strong>{formatClock(time)}</strong></div>
        <div className="w11-date">{formatDate(time)}</div>
      </div>
      <div className={`w11-cards-row ${showCards ? 'w11-cards-row--in' : ''}`}>
        <WeatherCard />
      </div>
      {!unlocking && (
        <div className="w11-signin-hint">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white" opacity="0.6">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
          <span>Click to sign in</span>
        </div>
      )}
    </div>
  )
}