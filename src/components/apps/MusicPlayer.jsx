import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, X, Maximize2, Clock3 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import '../components.css';

const LiveAudioVisualizer = ({
  audioElement,
  width = "100%",
  height = "100%",
  barWidth = 2,
  gap = 1,
  backgroundColor = "transparent",
  barColor,
  fftSize = 1024,
  maxDecibels = -10,
  minDecibels = -90,
  smoothingTimeConstant = 0.4,
}) => {
  const [context, setContext] = useState();
  const [audioSource, setAudioSource] = useState();
  const [analyser, setAnalyser] = useState();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!audioElement) return;
    if (audioElement._audioContext) {
      setContext(audioElement._audioContext);
      setAnalyser(audioElement._analyserNode);
      setAudioSource(audioElement._audioSource);
      return;
    }
    const ctx = new AudioContext();
    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = fftSize;
    analyserNode.minDecibels = minDecibels;
    analyserNode.maxDecibels = maxDecibels;
    analyserNode.smoothingTimeConstant = smoothingTimeConstant;
    try {
      const source = ctx.createMediaElementSource(audioElement);
      source.connect(analyserNode);
      analyserNode.connect(ctx.destination);
      audioElement._audioContext = ctx;
      audioElement._analyserNode = analyserNode;
      audioElement._audioSource = source;
      setContext(ctx);
      setAnalyser(analyserNode);
      setAudioSource(source);
    } catch (e) {
      console.error('Failed to create audio context:', e);
    }
    return () => {};
  }, [audioElement, fftSize, minDecibels, maxDecibels, smoothingTimeConstant]);
  const report = useCallback(() => {
    if (!analyser || !context || !audioElement || audioElement.paused) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    processFrequencyData(data);
    rafRef.current = requestAnimationFrame(report);
  }, [analyser, context, audioElement]);
  useEffect(() => {
    if (!analyser || !audioElement) return;
    const start = async () => {
      try {
        if (context?.state === 'suspended') {
          await context.resume();
        }
      } catch {}
      report();
    };
    const stop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    audioElement.addEventListener('play', start);
    audioElement.addEventListener('pause', stop);
    audioElement.addEventListener('ended', stop);
    if (!audioElement.paused) {
      start();
    }
    return () => {
      audioElement.removeEventListener('play', start);
      audioElement.removeEventListener('pause', stop);
      audioElement.removeEventListener('ended', stop);
      stop();
    };
  }, [analyser, context, audioElement, report]);
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);
  const processFrequencyData = (data) => {
    if (!canvasRef.current) return;
    const dataPoints = calculateBarData(
      data,
      canvasRef.current.width,
      barWidth,
      gap
    );
    draw(
      dataPoints,
      canvasRef.current,
      barWidth,
      gap,
      backgroundColor,
      barColor
    );
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "100%",
        aspectRatio: "unset",
      }}
    />
  );
};

const calculateBarData = (
  frequencyData,
  width,
  barWidth,
  gap
) => {
  let units = width / (barWidth + gap);
  units = Math.max(18, Math.floor(units * 0.45));
  let step = Math.floor(frequencyData.length / units);
  if (units > frequencyData.length) {
    units = frequencyData.length;
    step = 1;
  }
  const data = [];
  for (let i = 0; i < units; i++) {
    let sum = 0;
    for (let j = 0; j < step && i * step + j < frequencyData.length; j++) {
      sum += frequencyData[i * step + j];
    }
    data.push(sum / step);
  }
  return data;
};
const draw = (
  data,
  canvas,
  barWidth,
  gap,
  backgroundColor,
  barColor
) => {
  const centerY = canvas.height * 0.6;
  const maxBarHeight = Math.min(canvas.height * 0.8, 400);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const totalWidth = data.length * (barWidth + gap) - gap;
  const startX = (canvas.width - totalWidth) / 2;
  data.forEach((dp, i) => {
    ctx.fillStyle = barColor;
    const x = startX + i * (barWidth + gap);
    const center = data.length / 2;
    let sourceIndex = i;
    if (i >= center) {
      sourceIndex = Math.floor(data.length - 1 - i);
    }
    let barHeight = Math.min(data[sourceIndex] * 0.7, maxBarHeight);
    const distance = Math.abs(i - center);
    const maxDist = center;
    const normalizedDist = distance / maxDist;
    const factor = 0.3 + 0.7 * (1 - normalizedDist * normalizedDist);
    barHeight *= factor;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, centerY - barHeight, barWidth, barHeight, Math.min(barWidth, barHeight) / 2);
      ctx.fill();
    } else {
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);
    }
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, centerY, barWidth, barHeight, Math.min(barWidth, barHeight) / 2);
      ctx.fill();
    } else {
      ctx.fillRect(x, centerY, barWidth, barHeight);
    }
  });
};

const MusicPlayer = () => {
  const SEARCH_HISTORY_KEY = 'mp-search-history-v1';
  const MAX_SEARCH_HISTORY = 8;
  const { currentColors } = useUser();
  const accentColor = currentColors?.['--theme-accent-color'] || '#60a5fa';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [audioCandidates, setAudioCandidates] = useState([]);
  const [audioCandidateIndex, setAudioCandidateIndex] = useState(0);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [playLoadingId, setPlayLoadingId] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const searchUiRef = useRef(null);
  const audioRef = useRef(null);
  const playbackSnapshotRef = useRef({ time: 0, wasPlaying: false, volume: 1, url: '' });
  const shouldRestorePlaybackRef = useRef(false);
  const isCompactPlayer = viewportWidth < 980;
  const fallbackCover = (title = '') => `https://placehold.co/400x400/111827/E5E7EB?text=${encodeURIComponent((title || 'Music').slice(0, 20))}`;
  const capturePlaybackState = () => {
    const audio = audioRef.current;
    if (!audio) return;
    playbackSnapshotRef.current = {
      time: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      wasPlaying: !audio.paused,
      volume: Number.isFinite(audio.volume) ? audio.volume : volume,
      url: currentAudioUrl || '',
    };
    shouldRestorePlaybackRef.current = true;
  };
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSearchHistory(
          parsed
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, MAX_SEARCH_HISTORY)
        );
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    } catch {}
  }, [searchHistory]);
  useEffect(() => {
    const handleOutside = (event) => {
      if (!searchUiRef.current?.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);
  const toWsrvImage = (url, width = 480, height = 480) => {
    if (!url) return '';
    if (String(url).includes('wsrv.nl/')) return url;
    const normalized = String(url).replace(/^https?:\/\//, '');
    return `https://wsrv.nl/?url=${encodeURIComponent(normalized)}&w=${width}&h=${height}&fit=cover&output=webp`;
  };
  const getBestThumbnail = (track) => {
    const thumbs = track?.thumbnails;
    if (!Array.isArray(thumbs) || thumbs.length === 0) return '';
    const preferred = thumbs[2]?.url || thumbs[1]?.url || thumbs[0]?.url || '';
    return preferred;
  };
  const formatTime = (secs) => {
    if (!Number.isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  const saveSearchHistory = useCallback((term) => {
    const clean = String(term || '').trim();
    if (!clean) return;
    setSearchHistory((prev) => {
      const next = [
        clean,
        ...prev.filter((entry) => entry.toLowerCase() !== clean.toLowerCase())
      ].slice(0, MAX_SEARCH_HISTORY);
      return next;
    });
  }, []);
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setIsFetchingSuggestions(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setIsFetchingSuggestions(true);
        const response = await fetch(`https://verome-api.deno.dev/api/search/suggestions?q=${encodeURIComponent(q)}`);
        if (!response.ok) throw new Error('Suggestion fetch failed');
        const payload = await response.json();

        const source = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.suggestions)
            ? payload.suggestions
            : Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload?.items)
                ? payload.items
                : [];
        const normalized = source
          .map((item) => {
            if (typeof item === 'string') return item;
            if (!item || typeof item !== 'object') return '';
            return item.query || item.text || item.title || item.value || item.suggestion || item.name || '';
          })
          .map((value) => String(value || '').trim())
          .filter(Boolean);
        const seen = new Set();
        const unique = normalized.filter((value) => {
          const key = value.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (!cancelled) {
          setSuggestions(unique.slice(0, 8));
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsFetchingSuggestions(false);
        }
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);
  useEffect(() => {
    if (!audioRef.current || !currentAudioUrl) return;
    const audio = audioRef.current;
    const playNow = async () => {
      try {
        audio.muted = false;
        await audio.play();
      } catch {}
    };
    playNow();
  }, [currentAudioUrl]);
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.loop = isRepeatEnabled;
  }, [isRepeatEnabled]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;
    const snapshot = playbackSnapshotRef.current;
    if (!shouldRestorePlaybackRef.current || snapshot.url !== currentAudioUrl) return;
    const applySnapshot = async () => {
      try {
        if (Number.isFinite(snapshot.time) && snapshot.time > 0) {
          audio.currentTime = snapshot.time;
          setCurrentTime(snapshot.time);
        }
        audio.volume = Number.isFinite(snapshot.volume) ? snapshot.volume : volume;
        if (snapshot.wasPlaying) {
          await audio.play();
        }
        shouldRestorePlaybackRef.current = false;
      } catch {}
    };
    if (audio.readyState >= 1) {
      applySnapshot();
      return;
    }
    const onLoaded = () => {
      applySnapshot();
    };
    audio.addEventListener('loadedmetadata', onLoaded, { once: true });
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [currentAudioUrl, volume]);
  const searchSongs = async (searchQuery) => {
    if (!searchQuery) return;
    setLoading(true);
    setResults([]);
    setError(null);
    try {
      const response = await fetch(`https://verome-api.deno.dev/api/search?q=${encodeURIComponent(searchQuery)}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const resultsArray = Array.isArray(json?.results) ? json.results : [];
      const newResults = resultsArray
        .filter(item => item?.videoId)
        .map((item) => {
          const thumbUrl = item.thumbnails?.[1]?.url || item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi_webp/${item.videoId}/mqdefault.webp`;
          const artistsToShow = item.artists?.length > 0 ? item.artists : [{ name: item.author || 'Unknown Artist' }];
          const mappedTrack = {
            videoId: item.videoId,
            title: item.title || 'Untitled',
            artists: artistsToShow,
            durationText: item.duration || '',
            subtitle: item.subtitle || '',
            viewsText: '',
            metaText: item.subtitle || '',
            isExplicit: false,
            thumbnails: [{ url: thumbUrl }, { url: thumbUrl }, { url: thumbUrl }],
            ytify: {
              authorId: item.authorId,
              albumId: item.albumId,
            }
          };
          return mappedTrack;
        });
      setResults(newResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    saveSearchHistory(cleanQuery);
    setQuery(cleanQuery);
    setIsSearchDropdownOpen(false);
    searchSongs(cleanQuery);
  };
  const handleSearchSuggestion = (value) => {
    const cleanValue = String(value || '').trim();
    if (!cleanValue) return;
    setQuery(cleanValue);
    saveSearchHistory(cleanValue);
    setIsSearchDropdownOpen(false);
    searchSongs(cleanValue);
  };
  const playTrack = async (track) => {
    try {
      setPlayLoadingId(track.videoId);
      setError(null);
      shouldRestorePlaybackRef.current = false;
      playbackSnapshotRef.current = { time: 0, wasPlaying: false, volume, url: '' };
      setCurrentTime(0);
      setDuration(0);
      const streamResponse = await fetch(`http://127.0.0.1:5000/api/api?v=${encodeURIComponent(track.videoId)}`);
      if (!streamResponse.ok) {
        throw new Error(`Stream API error: ${streamResponse.status}`);
      }
      const streamData = await streamResponse.json();
      if (!streamData?.success || !Array.isArray(streamData?.streamingUrls) || streamData.streamingUrls.length === 0) {
        throw new Error('No streaming URLs returned');
      }
      const candidates = streamData.streamingUrls
        .map((s) => s?.url)
        .filter(Boolean)
        .map(url => {
          try {
            const urlObj = new URL(url);
            return `http://yt.omada.cafe/videoplayback${urlObj.search}`;
          } catch (e) {
            return url;
          }
        });
      const metaCover = streamData?.metadata?.thumbnail || getBestThumbnail(track);
      setCurrentTrack(track);
      setCurrentCoverUrl(metaCover || getBestThumbnail(track));
      setAudioCandidates(candidates);
      setAudioCandidateIndex(0);
      setCurrentAudioUrl(candidates[0]);
      setIsPlayerExpanded(true);
    } catch (err) {
      console.error(err); 
      setError("Failed to load stream");
    } finally {
      setPlayLoadingId(null);
    }
  };

  return (
    <div className="music-player-container mp-container">
      <form onSubmit={handleSearch} className="mp-search-form" ref={searchUiRef}>
        <div className="mp-search-wrap">
          <input
            id="saavn-search-box"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsSearchDropdownOpen(true);
            }}
            onFocus={() => setIsSearchDropdownOpen(true)}
            placeholder="Search for songs..."
            className="mp-search-input"
            autoComplete="off"
          />
          {isSearchDropdownOpen && (
            <div className="mp-search-dropdown">
              {query.trim() ? (
                <>
                  {isFetchingSuggestions && <div className="mp-search-hint">Loading suggestions...</div>}
                  {!isFetchingSuggestions && suggestions.length === 0 && (
                    <div className="mp-search-hint">No suggestions found</div>
                  )}
                  {suggestions.map((item) => (
                    <button
                      type="button"
                      key={`suggestion-${item}`}
                      className="mp-search-item"
                      onClick={() => handleSearchSuggestion(item)}
                    >
                      <Search size={14} />
                      <span>{item}</span>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div className="mp-search-head">
                    <span>Recent searches</span>
                    {searchHistory.length > 0 && (
                      <button type="button" className="mp-search-clear" onClick={clearSearchHistory}>
                        Clear
                      </button>
                    )}
                  </div>
                  {searchHistory.length === 0 && (
                    <div className="mp-search-hint">No search history yet</div>
                  )}
                  {searchHistory.map((item) => (
                    <button
                      type="button"
                      key={`history-${item}`}
                      className="mp-search-item"
                      onClick={() => handleSearchSuggestion(item)}
                    >
                      <span className="mp-search-item-clock"><Clock3 size={14} /></span>
                      <span>{item}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <button type="submit" className="mp-search-btn">
          <Search size={16} /> Search
        </button>
      </form>
      {error && <div className="mp-error">Error: {error}</div>}
      {loading ? (
        <div className="mp-loading" aria-label="Loading search results" role="status">
          <div className="mp-loading-spinner" />
        </div>
      ) : (
        <div id="saavn-results" className="mp-results">
          {results.map((track) => {
            return (
            <div 
              key={track.videoId} 
              className="song-container mp-song-card" 
              onClick={() => playLoadingId !== track.videoId && playTrack(track)}
              data-loading={playLoadingId === track.videoId ? '1' : '0'}
            >
              {playLoadingId === track.videoId && (
                <div className="mp-song-loading">
                  ⏳ Loading...
                </div>
              )}
              <div className="mp-thumb-wrap">
                <img 
                  src={toWsrvImage(getBestThumbnail(track), 260, 146) || getBestThumbnail(track) || fallbackCover(track.title)}
                  data-raw-src={getBestThumbnail(track) || ''}
                  alt={track.title} 
                  className="mp-thumb"
                />
                {track.durationText && (
                  <span className="mp-duration">
                    {track.durationText}
                  </span>
                )}
              </div>
              <div className="mp-song-info">
                <h4 className="mp-song-title">
                  {track.title || 'Untitled'}
                </h4>
                <div className="mp-song-artist">
                  {track.artists && track.artists.length > 0 ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist'}
                </div>
                <div className="mp-song-meta">
                  {track.metaText}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
      {isPlayerExpanded && currentTrack && (
        <div className="mp-expanded">
          <div className="mp-expanded-overlay" />
          <div className="mp-expanded-topbar">
            <button
              onClick={() => {
                capturePlaybackState();
                setIsPlayerExpanded(false);
              }}
              className="fs-control-btn mp-icon-btn"
            >
              <X size={22} />
            </button>
          </div>
          <div className="mp-expanded-content">
            <div className="mp-expanded-cover-wrap">
               <img
                src={toWsrvImage(currentCoverUrl || getBestThumbnail(currentTrack), 800, 800) || currentCoverUrl || getBestThumbnail(currentTrack) || fallbackCover(currentTrack.title)}
                data-raw-src={currentCoverUrl || getBestThumbnail(currentTrack) || ''}
                alt={currentTrack.title}
                onError={(e) => {
                  if (!e.currentTarget.dataset.rawTried && e.currentTarget.dataset.rawSrc) {
                    e.currentTarget.dataset.rawTried = '1';
                    e.currentTarget.src = e.currentTarget.dataset.rawSrc;
                    return;
                  }
                  e.currentTarget.src = fallbackCover(currentTrack.title);
                }}
                className="mp-expanded-cover"
              />
            </div>
            <div className="mp-expanded-info">
              <h1 className="mp-expanded-title">
                {currentTrack.title}
              </h1>
              <div className="mp-expanded-meta-row">
                <span>{currentTrack.artists?.map((artist) => artist.name).join(', ') || 'Unknown Artist'}</span>
                {(currentTrack.metaText || currentTrack.viewsText) && (
                  <>
                    <span className="mp-dot">•</span>
                    <span>{currentTrack.metaText || currentTrack.viewsText}</span>
                  </>
                )}
              </div>
              <div className="mp-expanded-controls-wrap">
                <div className="mp-expanded-seek-row">
                   <span className="mp-time-text">{formatTime(currentTime)}</span>
                   <input
                    className="mp-expanded-seek"
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => {
                      const t = Number(e.target.value);
                      setCurrentTime(t);
                      if (audioRef.current) audioRef.current.currentTime = t;
                    }}
                  />
                   <span className="mp-time-text">{formatTime(duration)}</span>
                </div>
                <div className="mp-expanded-controls">
                  <button className="fs-control-btn" title="Shuffle"><Shuffle size={20} opacity={0.7} /></button>
                  <button className="fs-control-btn" onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10; }}><SkipBack size={32} /></button>
                  <button 
                    onClick={() => {
                      if (!audioRef.current) return;
                      if (audioRef.current.paused) audioRef.current.play(); else audioRef.current.pause();
                    }}
                    className="mp-main-play-btn"
                  >
                    {isPlaying ? <Pause size={36} fill="#000" /> : <Play className="mp-main-play-icon" size={36} fill="#000" />}
                  </button>
                  <button className="fs-control-btn" onClick={() => { if(audioRef.current) audioRef.current.currentTime += 10; }}><SkipForward size={32} /></button>
                  <button
                    className="fs-control-btn"
                    title={isRepeatEnabled ? 'Repeat on' : 'Repeat off'}
                    onClick={() => setIsRepeatEnabled((prev) => !prev)}
                    aria-pressed={isRepeatEnabled}
                  >
                    <Repeat size={20} opacity={isRepeatEnabled ? 1 : 0.7} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mp-expanded-bars" style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '100%',
            pointerEvents: 'none',
            zIndex: -1,
            opacity: 0.7
          }}>
            <LiveAudioVisualizer
              audioElement={audioRef.current}
              width={1280}
              height={720}
              barWidth={11}
              gap={6}
              backgroundColor="transparent"
              barColor="white"
            />
          </div>
        </div>
      )}
      {currentTrack && !isPlayerExpanded && (
        <div className={`mp-mini-player ${isCompactPlayer ? 'is-compact' : ''}`}>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const t = Number(e.target.value);
              setCurrentTime(t);
              if (audioRef.current) audioRef.current.currentTime = t;
            }}
            className="mp-mini-progress-range"
          />
          <div className="mp-mini-left">
            <button
              onClick={() => {
                if (!audioRef.current) return;
                audioRef.current.currentTime = Math.max(0, (audioRef.current.currentTime || 0) - 10);
              }}
              className="mp-ghost-btn"
              title="Back 10s"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={() => {
                if (!audioRef.current) return;
                if (audioRef.current.paused) audioRef.current.play(); else audioRef.current.pause();
              }}
              className="mp-mini-main-btn"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={() => {
                if (!audioRef.current) return;
                audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, (audioRef.current.currentTime || 0) + 10);
              }}
              className="mp-ghost-btn"
              title="Forward 10s"
            >
              <SkipForward size={20} />
            </button>
            <div className="mp-mini-time">{formatTime(currentTime)} / {formatTime(duration)}</div>
          </div>

          <div className="mp-mini-center">
            <div className={`mp-mini-track ${isCompactPlayer ? 'is-compact' : ''}`}>
              <img
                src={toWsrvImage(currentCoverUrl || getBestThumbnail(currentTrack), 96, 96) || currentCoverUrl || getBestThumbnail(currentTrack) || fallbackCover(currentTrack.title)}
                data-raw-src={currentCoverUrl || getBestThumbnail(currentTrack) || ''}
                alt=""
                onError={(e) => {
                  if (!e.currentTarget.dataset.rawTried && e.currentTarget.dataset.rawSrc) {
                    e.currentTarget.dataset.rawTried = '1';
                    e.currentTarget.src = e.currentTarget.dataset.rawSrc;
                    return;
                  }
                  e.currentTarget.src = fallbackCover(currentTrack.title);
                }}
                className="mp-mini-cover"
              />
              <div className="mp-mini-track-text">
                <div className="mp-mini-track-title">{currentTrack.title}</div>
                <div className="mp-mini-track-artist">
                  {currentTrack.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist'}
                </div>
              </div>
            </div>
          </div>

          <div className="mp-mini-right">
            <button
              className="mp-ghost-btn mp-ghost-muted"
              title={isRepeatEnabled ? 'Repeat on' : 'Repeat off'}
              onClick={() => setIsRepeatEnabled((prev) => !prev)}
              aria-pressed={isRepeatEnabled}
            >
              <Repeat size={17} opacity={isRepeatEnabled ? 1 : 0.7} />
            </button>
            <button
              onClick={() => {
                capturePlaybackState();
                setIsPlayerExpanded(true);
              }}
              className="mp-open-btn"
              title="Open player"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      )}
      <audio
        ref={audioRef}
        key={currentAudioUrl || 'player-empty'}
        src={currentAudioUrl || ''}
        crossOrigin="anonymous"
        autoPlay
        preload="metadata"
        className="mp-audio-hidden"
        onLoadedMetadata={() => {
          if (audioRef.current) {
            audioRef.current.muted = false;
            audioRef.current.volume = volume;
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onPlay={() => {
          if (audioRef.current) {
            audioRef.current.muted = false;
            audioRef.current.volume = volume;
            setIsPlaying(true);
          }
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime || 0);
        }}
        onError={(err) => {
          console.error('Audio error:', err);
          setAudioCandidateIndex((prev) => {
            const next = prev + 1;
            if (next < audioCandidates.length) {
              setCurrentAudioUrl(audioCandidates[next]);
              setError(`Trying fallback source ${next + 1}/${audioCandidates.length}...`);
              return next;
            }
            setError('Failed to play this track (all sources failed)');
            return prev;
          });
        }}
      />
    </div>
  );
};

export default MusicPlayer;
