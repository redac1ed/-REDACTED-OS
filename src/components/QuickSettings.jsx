import { useState, useEffect } from 'react';
import { 
  MdBluetooth, 
  MdAirplaneTicket, 
  MdWbSunny,
  MdSettings,
  MdKeyboardArrowRight,
  MdNightlight,
  MdAccessibilityNew
} from 'react-icons/md';
import { LuWifi, LuWifiHigh, LuWifiLow, LuWifiOff } from "react-icons/lu";
import { BsBatteryCharging, BsBatteryHalf, BsBatteryFull } from "react-icons/bs";
import { IoVolumeLow, IoVolumeMedium, IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { useUser } from '../contexts/UserContext';

export default function QuickSettings({ isOpen, onClose, onOpenSettings }) {
  const { brightness, setBrightness, nightLight, setNightLight, volume, setVolume, resumeAudio } = useUser();
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(true);
  const [airplane, setAirplane] = useState(false);
  const [saver, setSaver] = useState(false);
  const [wifiName, setWifiName] = useState('WiFi');
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [wifiLevel, setWifiLevel] = useState('high');
  const [batteryCharging, setBatteryCharging] = useState(false);
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
  useEffect(() => {
     if ('getBattery' in navigator) {  
        navigator.getBattery().then(bat => {
            setBatteryLevel(Math.round(bat.level * 100));
            setBatteryCharging(bat.charging);
            const updateBattery = () => {
              setBatteryLevel(Math.round(bat.level * 100));
              setBatteryCharging(bat.charging);
            };
            bat.addEventListener('levelchange', updateBattery);
            bat.addEventListener('chargingchange', updateBattery);
        }).catch(err => console.error(err));
     }
  }, []);
  useEffect(() => {
    if (!isOpen) return;    
    if ('connection' in navigator) {
      const conn = navigator.connection;
      const updateWifi = () => {
         if (conn.type === 'wifi' || conn.effectiveType === '4g') {
           setWifiName('Wi-Fi');
         } else if (conn.type === 'cellular') {
           setWifiName('Cellular');
         } else if (conn.type === 'ethernet') {
           setWifiName('Ethernet');
         } else {
           setWifiName(navigator.onLine ? 'Network Connected' : 'No Internet');
         }
         setWifiLevel(getWifiLevelFromConnection());
      };
      if (typeof navigator.connection.addEventListener === 'function') {
        navigator.connection.addEventListener('change', updateWifi);
      }
      return () => {
         if (typeof navigator.connection.removeEventListener === 'function') {
            navigator.connection.removeEventListener('change', updateWifi);
         }
      }
    }
    return undefined;
  }, [isOpen]);
  if (!isOpen) return null;
  const getWifiIcon = () => {
    switch (wifiLevel) {
      case 'off':
        return <LuWifiOff size={20} />;
      case 'zero':
        return <LuWifiLow size={20} />;
      case 'low':
        return <LuWifiHigh size={20} />;
      case 'high':
      case 'full':
      default:
        return <LuWifi size={20} />;
    }
  };
  const getVolumeIcon = () => {
    if (volume === 0) return <IoVolumeMute size={20} />;
    if (volume < 33) return <IoVolumeLow size={20} />;
    if (volume < 66) return <IoVolumeMedium size={20} />;
    return <IoVolumeHigh size={20} />;
  };
  const getBatteryIcon = () => {
    const safeLevel = Math.max(0, Math.min(100, Number(batteryLevel) || 0))
    if (batteryCharging) return <BsBatteryCharging size={20} style={{ color: '#86efac' }} />
    if (safeLevel > 80) return <BsBatteryFull size={20} />
    return (
      <BsBatteryHalf 
        size={20} 
        style={{ 
          color: safeLevel <= 15 ? '#f87171' : safeLevel <= 35 ? '#fbbf24' : 'currentColor' 
        }} 
      />
    )
  };

  return (
    <div className="quick-settings-overlay" onClick={onClose}>
      <div className="quick-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="qs-grid">
          <div className={`qs-item ${wifi ? 'active' : ''}`} onClick={() => setWifi(!wifi)}>
            <div className="qs-icon-wrapper">
              {getWifiIcon()}
              <div className="qs-split-icon"><MdKeyboardArrowRight size={16} /></div>
            </div>
            <span className="qs-label">{wifi ? (wifiName === 'WiFi' ? 'WiFi' : wifiName) : 'Internet'}</span>
          </div>
          <div className={`qs-item ${bluetooth ? 'active' : ''}`} onClick={() => setBluetooth(!bluetooth)}>
            <div className="qs-icon-wrapper">
              <MdBluetooth size={20} />
              <div className="qs-split-icon"><MdKeyboardArrowRight size={16} /></div>
            </div>
            <span className="qs-label">Bluetooth</span>
          </div>
          <div className={`qs-item ${airplane ? 'active' : ''}`} onClick={() => setAirplane(!airplane)}>
            <div className="qs-icon-wrapper">
              <MdAirplaneTicket size={20} />
            </div>
            <span className="qs-label">Airplane</span>
          </div>
          <div className={`qs-item ${saver ? 'active' : ''}`} onClick={() => setSaver(!saver)}>
            <div className="qs-icon-wrapper">
              {getBatteryIcon()}
            </div>
            <span className="qs-label">Battery saver</span>
          </div>
          <div className={`qs-item ${nightLight ? 'active' : ''}`} onClick={() => setNightLight(!nightLight)}>
            <div className="qs-icon-wrapper">
              <MdNightlight size={20} />
            </div>
            <span className="qs-label">Night light</span>
          </div>
          <div className="qs-item" onClick={() => {}}>
            <div className="qs-icon-wrapper">
              <MdAccessibilityNew size={20} />
            </div>
            <span className="qs-label">Accessibility</span>
          </div>
        </div>
        <div className="qs-sliders">
          <div className="qs-slider-group">
            <MdWbSunny size={20} className="qs-slider-icon" />
            <div className="qs-slider-container">
              <div className="qs-slider-track" />
              <div className="qs-slider-fill" style={{ width: `${brightness}%` }} />
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={brightness} 
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="qs-slider"
              />
            </div>
          </div>
          <div className="qs-slider-group">
            {getVolumeIcon()}
            <div className="qs-slider-container">
              <div className="qs-slider-track" />
              <div className="qs-slider-fill" style={{ width: `${volume}%` }} />
              <input type="range" min="0" max="100" value={volume} onChange={(e) => { setVolume(Number(e.target.value)); resumeAudio(); }} className="qs-slider" />
            </div>
          </div>
        </div>
        <div className="qs-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: '12px', opacity: 0.8 }}>
          <div className="qs-battery" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getBatteryIcon()}
            <span>{batteryLevel !== null ? batteryLevel + '%' : 'Unknown'}</span>
          </div>
          <div className="qs-footer-btns" style={{ display: 'flex', gap: '16px' }}>
             <MdSettings size={20} style={{ cursor: 'pointer' }} onClick={onOpenSettings} />
          </div>
        </div>
      </div>
    </div>
  );
}
