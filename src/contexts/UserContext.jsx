import { createContext, useContext, useMemo, useState, useEffect } from 'react';

const UserContext = createContext();
const STORAGE_KEYS = {
  THEME: 'os.theme.v2',
  CUSTOM: 'os.custom-theme.v2',
  LEGACY_THEME: 'os_theme',
  LEGACY_CUSTOM: 'os_custom_theme',
  BRIGHTNESS: 'os.display.brightness.v1',
  NIGHT_LIGHT: 'os.display.nightlight.v1',
};
const defaultThemes = {
  dark: {
    name: 'Midnight Glass',
    colors: {
      '--theme-bg-color': 'rgba(18, 20, 28, 0.85)',
      '--theme-text-color': '#f5f8ff',
      '--theme-muted-text': 'rgba(225, 232, 255, 0.6)',
      '--theme-border-color': 'rgba(255, 255, 255, 0.08)',
      '--theme-card-bg': 'rgba(255, 255, 255, 0.03)',
      '--theme-input-bg': 'rgba(0, 0, 0, 0.2)',
      '--theme-input-border': 'rgba(255, 255, 255, 0.1)',
      '--theme-accent-color': '#60a5fa',
      '--theme-accent-rgb': '96, 165, 250',
      '--theme-focus-ring': 'rgba(96, 165, 250, 0.3)',
      '--theme-window-color-rgb': '18, 20, 28',
      '--theme-window-opacity': '0.85',
      '--theme-window-blur': '24px',
      '--theme-window-border': 'rgba(255, 255, 255, 0.1)',
      '--theme-window-radius': '12px',
      '--theme-taskbar-color-rgb': '10, 12, 16',
      '--theme-taskbar-opacity': '0.85',
      '--theme-taskbar-border': 'rgba(255, 255, 255, 0.08)',
      '--theme-taskbar-text': '#eaf1ff',
      '--theme-taskbar-bg': 'rgba(10, 12, 16, 0.85)',
      '--desktop-bg': "url('https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=3840&q=100')",
    }
  },
  light: {
    name: 'Cloud Glass',
    colors: {
      '--theme-bg-color': 'rgba(250, 250, 250, 0.85)',
      '--theme-text-color': '#1a1a1a',
      '--theme-muted-text': 'rgba(26, 26, 26, 0.6)',
      '--theme-border-color': 'rgba(0, 0, 0, 0.1)',
      '--theme-card-bg': 'rgba(255, 255, 255, 0.5)',
      '--theme-input-bg': 'rgba(255, 255, 255, 0.8)',
      '--theme-input-border': 'rgba(0, 0, 0, 0.15)',
      '--theme-accent-color': '#3b82f6',
      '--theme-accent-rgb': '59, 130, 246',
      '--theme-focus-ring': 'rgba(59, 130, 246, 0.3)',
      '--theme-window-color-rgb': '255, 255, 255',
      '--theme-window-opacity': '0.85',
      '--theme-window-blur': '24px',
      '--theme-window-border': 'rgba(0, 0, 0, 0.1)',
      '--theme-window-radius': '12px',
      '--theme-taskbar-color-rgb': '245, 245, 245',
      '--theme-taskbar-opacity': '0.85',
      '--theme-taskbar-border': 'rgba(0, 0, 0, 0.1)',
      '--theme-taskbar-text': '#1a1a1a',
      '--theme-taskbar-bg': 'rgba(245, 245, 245, 0.85)',
      '--desktop-bg': "url('https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=3840&q=100')",
    }
  },
  blue: {
    name: 'Aurora Blue',
    colors: {
      '--theme-bg-color': 'rgba(15, 23, 42, 0.85)',
      '--theme-text-color': '#f8fafc',
      '--theme-muted-text': 'rgba(248, 250, 252, 0.6)',
      '--theme-border-color': 'rgba(255, 255, 255, 0.1)',
      '--theme-card-bg': 'rgba(255, 255, 255, 0.03)',
      '--theme-input-bg': 'rgba(0, 0, 0, 0.2)',
      '--theme-input-border': 'rgba(255, 255, 255, 0.1)',
      '--theme-accent-color': '#38bdf8',
      '--theme-accent-rgb': '56, 189, 248',
      '--theme-focus-ring': 'rgba(56, 189, 248, 0.3)',
      '--theme-window-color-rgb': '15, 23, 42',
      '--theme-window-opacity': '0.85',
      '--theme-window-blur': '24px',
      '--theme-window-border': 'rgba(255, 255, 255, 0.1)',
      '--theme-window-radius': '12px',
      '--theme-taskbar-color-rgb': '11, 15, 25',
      '--theme-taskbar-opacity': '0.85',
      '--theme-taskbar-border': 'rgba(255, 255, 255, 0.1)',
      '--theme-taskbar-text': '#f8fafc',
      '--theme-taskbar-bg': 'rgba(11, 15, 25, 0.85)',
      '--desktop-bg': "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=3840&q=100')",
    }
  },
  purple: {
    name: 'Amethyst Glow',
    colors: {
      '--theme-bg-color': 'rgba(30, 20, 40, 0.85)',
      '--theme-text-color': '#faf5ff',
      '--theme-muted-text': 'rgba(250, 245, 255, 0.6)',
      '--theme-border-color': 'rgba(255, 255, 255, 0.1)',
      '--theme-card-bg': 'rgba(255, 255, 255, 0.03)',
      '--theme-input-bg': 'rgba(0, 0, 0, 0.2)',
      '--theme-input-border': 'rgba(255, 255, 255, 0.1)',
      '--theme-accent-color': '#c084fc',
      '--theme-accent-rgb': '192, 132, 252',
      '--theme-focus-ring': 'rgba(192, 132, 252, 0.3)',
      '--theme-window-color-rgb': '30, 20, 40',
      '--theme-window-opacity': '0.85',
      '--theme-window-blur': '24px',
      '--theme-window-border': 'rgba(255, 255, 255, 0.1)',
      '--theme-window-radius': '12px',
      '--theme-taskbar-color-rgb': '20, 10, 30',
      '--theme-taskbar-opacity': '0.85',
      '--theme-taskbar-border': 'rgba(255, 255, 255, 0.1)',
      '--theme-taskbar-text': '#faf5ff',
      '--theme-taskbar-bg': 'rgba(20, 10, 30, 0.85)',
      '--desktop-bg': "url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=3840&q=100')",
    }
  }
};

const toCssUrl = (value) => {
  if (!value) return "url('/primary-bg.jpg')";
  if (value.startsWith('url(')) return value;
  return `url('${value}')`;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: '[REDACTED]',
    avatar: 'https://avatars.githubusercontent.com/u/189115938?v=4&size=64',
    email: 'me@redac.me',
    accountType: 'Local Account'
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME)
      || localStorage.getItem(STORAGE_KEYS.LEGACY_THEME)
      || 'dark';
  });
  const [customTheme, setCustomTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM)
        || localStorage.getItem(STORAGE_KEYS.LEGACY_CUSTOM);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [brightness, setBrightness] = useState(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEYS.BRIGHTNESS));
    if (Number.isFinite(saved) && saved >= 10 && saved <= 100) return saved;
    return 100;
  });
  const [nightLight, setNightLight] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.NIGHT_LIGHT) === 'true';
  });
  const currentColors = useMemo(() => {
    const base = defaultThemes[theme]?.colors || defaultThemes.dark.colors;
    if (theme !== 'custom') return base;
    return { ...defaultThemes.dark.colors, ...customTheme };
  }, [theme, customTheme]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    localStorage.setItem(STORAGE_KEYS.LEGACY_THEME, theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM, JSON.stringify(customTheme));
    localStorage.setItem(STORAGE_KEYS.LEGACY_CUSTOM, JSON.stringify(customTheme));
  }, [customTheme]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BRIGHTNESS, String(brightness));
  }, [brightness]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NIGHT_LIGHT, String(nightLight));
  }, [nightLight]);
  useEffect(() => {
    const filter = [];
    if (brightness < 100) {
      filter.push(`brightness(${brightness}%)`);
    }
    if (nightLight) {
      filter.push('sepia(40%) hue-rotate(10deg) saturate(150%)');
    }
    document.body.style.filter = filter.join(' ') || 'none';
    return () => {
      document.body.style.filter = 'none';
    };
  }, [brightness, nightLight]);
  const setThemePreset = (presetId) => {
    if (!defaultThemes[presetId]) return;
    setTheme(presetId);
  };
  const updateCustomTheme = (updates) => {
    if (theme !== 'custom') {
      const base = defaultThemes[theme]?.colors || defaultThemes.dark.colors;
      setCustomTheme({ ...base, ...updates });
      setTheme('custom');
      return;
    }
    setCustomTheme((prev) => ({ ...prev, ...updates }));
  };
  const setWallpaper = (value) => {
    updateCustomTheme({ '--desktop-bg': toCssUrl(value) });
  };
  const resetCustomTheme = () => {
    setCustomTheme({ ...defaultThemes.dark.colors });
    setTheme('custom');
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        theme,
        setTheme,
        setThemePreset,
        currentColors,
        updateCustomTheme,
        setWallpaper,
        resetCustomTheme,
        availableThemes: defaultThemes,
        brightness,
        setBrightness,
        nightLight,
        setNightLight,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context) return context;
  return {
    user: null,
    setUser: () => {},
    theme: 'dark',
    setTheme: () => {},
    setThemePreset: () => {},
    currentColors: defaultThemes.dark.colors,
    updateCustomTheme: () => {},
    setWallpaper: () => {},
    resetCustomTheme: () => {},
    availableThemes: defaultThemes,
    brightness: 100,
    setBrightness: () => {},
    nightLight: false,
    setNightLight: () => {},
  };
};
