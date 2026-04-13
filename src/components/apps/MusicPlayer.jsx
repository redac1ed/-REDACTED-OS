import { useEffect, useRef, useState } from 'react';
import { Search, Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, X, Maximize2 } from 'lucide-react';
import '../components.css';

const MusicPlayer = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [audioCandidates, setAudioCandidates] = useState([]);
  const [audioCandidateIndex, setAudioCandidateIndex] = useState(0);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playLoadingId, setPlayLoadingId] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [vizLevels, setVizLevels] = useState(Array(40).fill(0.05));
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const sourceElementRef = useRef(null);
  const animationFrameRef = useRef(null);
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
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;
    let mediaUrlOrigin = '';
    try {
      mediaUrlOrigin = new URL(currentAudioUrl, window.location.origin).origin;
    } catch {
      mediaUrlOrigin = '';
    }
    if (mediaUrlOrigin && mediaUrlOrigin !== window.location.origin) {
      setVizLevels((prev) => prev.map((_, i) => 0.15 + ((i % 7) * 0.03)));
      return;
    }
    const initAudioVisualizer = async () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        if (!analyserRef.current) {
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 128;
          analyserRef.current.smoothingTimeConstant = 0.82;
          analyserRef.current.connect(audioContext.destination);
        }
        if (sourceElementRef.current !== audio) {
          if (sourceRef.current) {
            try {
              sourceRef.current.disconnect();
            } catch {}
          }
          sourceRef.current = audioContext.createMediaElementSource(audio);
          sourceElementRef.current = audio;
          sourceRef.current.connect(analyserRef.current);
        }
        const analyser = analyserRef.current;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const animate = () => {
          analyser.getByteFrequencyData(data);
          const next = Array.from({ length: 40 }, (_, i) => {
            const idx = Math.floor((i / 40) * data.length);
            return Math.max(0.05, data[idx] / 255);
          });
          setVizLevels(next);
          animationFrameRef.current = requestAnimationFrame(animate);
        };
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animate();
      } catch (e) {
        console.error('Visualizer init failed:', e);
      }
    };
    initAudioVisualizer();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentAudioUrl, isPlayerExpanded, isFullscreen]);
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
  }, [isPlayerExpanded, isFullscreen, currentAudioUrl, volume]);
  const searchSongs = async (searchQuery) => {
    if (!searchQuery) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/api?q=${encodeURIComponent(searchQuery)}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const resultsArray = Array.isArray(json) ? json : [];
      const newResults = resultsArray
        .filter(item => {
          return Boolean(item?.id) && typeof item?.subtext === 'string' && /view/i.test(item.subtext);
        })
        .map((item) => {
          const durationText = item.duration || '';
          const artistsToShow = item.author ? [{ name: item.author }] : [{ name: 'Unknown Artist' }];
          const metaText = item.subtext || [item.author, durationText].filter(Boolean).join(' • ');
          const thumbUrl = `https://i.ytimg.com/vi_webp/${item.id}/mqdefault.webp`;
          const mappedTrack = {
            videoId: item.id,
            title: item.title || 'Untitled',
            artists: artistsToShow,
            durationText: durationText,
            subtitle: item.subtext || '',
            viewsText: item.subtext || '',
            metaText,
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
    searchSongs(query);
  };
  const playTrack = async (track) => {
    try {
      setPlayLoadingId(track.videoId);
      setError(null);
      shouldRestorePlaybackRef.current = false;
      playbackSnapshotRef.current = { time: 0, wasPlaying: false, volume, url: '' };
      setCurrentTime(0);
      setDuration(0);
      const proxyResponse = await fetch(`/api/api?v=${track.videoId}`);
      if (!proxyResponse.ok) {
        throw new Error(`Proxy error: ${proxyResponse.status}`);
      }
      const proxyData = await proxyResponse.json();
      if (!proxyData.url) {
        throw new Error('No audio URL returned from proxy');
      }
      const candidates = proxyData.urls && proxyData.urls.length > 0 ? proxyData.urls : [proxyData.url];
      const metaCover = getBestThumbnail(track);
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
      <form onSubmit={handleSearch} className="mp-search-form">
        <input
          id="saavn-search-box"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for songs..."
          className="mp-search-input"
        />
        <button type="submit" className="mp-search-btn">
          <Search size={16} /> Search
        </button>
      </form>
      {error && <div className="mp-error">Error: {error}</div>}
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
      {loading && <div className="mp-loading">Fetching results...</div>}
      {isPlayerExpanded && currentTrack && (
        <div className={`mp-expanded ${isFullscreen ? 'is-fullscreen' : ''}`}>
          <div className="mp-expanded-bars">
            {Array.from({ length: isFullscreen ? 120 : 80 }).map((_, index) => {
              const level = vizLevels[index % vizLevels.length] || 0.05;
              const levelClass = `lvl-${Math.min(9, Math.max(0, Math.floor(level * 10)))}`;
              return (
              <span
                key={`bg-bar-${index}`}
                className={`mp-bg-bar ${levelClass}`}
              />
            )})}
          </div>
          <div className="mp-expanded-overlay" />
          <div className="mp-expanded-topbar">
            <button
              onClick={() => {
                capturePlaybackState();
                if(isFullscreen) setIsFullscreen(false);
                else setIsPlayerExpanded(false);
              }}
              className="fs-control-btn mp-icon-btn"
            >
              <X size={22} />
            </button>
            <div className="mp-expanded-topbar-actions">
              <button
                onClick={() => {
                  capturePlaybackState();
                  setIsFullscreen(!isFullscreen);
                }}
                className="fs-control-btn mp-icon-btn"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>
          <div className={`mp-expanded-content ${isFullscreen ? 'is-fullscreen' : ''}`}>
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
                className={`mp-expanded-cover ${isFullscreen ? 'is-fullscreen' : ''}`}
              />
            </div>
            <div className={`mp-expanded-info ${isFullscreen ? 'is-fullscreen' : ''}`}>
              <h1 className={`mp-expanded-title ${isFullscreen ? 'is-fullscreen' : ''}`}>
                {currentTrack.title}
              </h1>
              <div className={`mp-expanded-meta-row ${isFullscreen ? 'is-fullscreen' : ''}`}>
                <span>{currentTrack.artists?.map((artist) => artist.name).join(', ') || 'Unknown Artist'}</span>
                {(currentTrack.metaText || currentTrack.viewsText) && (
                  <>
                    <span className="mp-dot">•</span>
                    <span>{currentTrack.metaText || currentTrack.viewsText}</span>
                  </>
                )}
                {currentTrack.durationText && (
                  <>
                    <span className="mp-dot">•</span>
                    <span>{currentTrack.durationText}</span>
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
                <div className={`mp-expanded-controls ${isFullscreen ? 'is-fullscreen' : ''}`}>
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
                  <button className="fs-control-btn" title="Repeat"><Repeat size={20} opacity={0.7} /></button>
                </div>
              </div>
            </div>
          </div>
          <audio
              ref={audioRef}
              key={currentAudioUrl || 'expanded-empty'}
              src={currentAudioUrl || ''}
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
                    return next;
                  }
                  return prev;
                });
              }}
            />
        </div>
      )}
      {currentTrack && !isPlayerExpanded && (
        <div className={`mp-mini-player ${isCompactPlayer ? 'is-compact' : ''}`}>
        {!isCompactPlayer && <button
          onClick={() => {
            if (!audioRef.current) return;
            audioRef.current.currentTime = Math.max(0, (audioRef.current.currentTime || 0) - 10);
          }}
          className="mp-ghost-btn"
          title="Back 10s"
        >
          <SkipBack size={20} />
        </button>}
        <button
          onClick={() => {
            if (!audioRef.current) return;
            if (audioRef.current.paused) audioRef.current.play(); else audioRef.current.pause();
          }}
          className="mp-ghost-btn"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        {!isCompactPlayer && <button
          onClick={() => {
            if (!audioRef.current) return;
            audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, (audioRef.current.currentTime || 0) + 10);
          }}
          className="mp-ghost-btn"
          title="Forward 10s"
        >
          <SkipForward size={20} />
        </button>}
        <div className="mp-mini-time">{formatTime(currentTime)} / {formatTime(duration)}</div>
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
              {currentTrack.artists?.map(artist => artist.name).join(', ')}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            capturePlaybackState();
            setIsPlayerExpanded(true);
          }}
          className="mp-open-btn"
        >
          <Maximize2 size={15} /> Open Player
        </button>
        {!isCompactPlayer && <button className="mp-ghost-btn mp-ghost-muted" title="Shuffle">
          <Shuffle size={17} />
        </button>}
        {!isCompactPlayer && <button className="mp-ghost-btn mp-ghost-muted" title="Repeat">
          <Repeat size={17} />
        </button>}
        <Volume2 size={17} className="mp-volume-icon" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            if (audioRef.current) audioRef.current.volume = v;
          }}
          className={`mp-volume-range ${isCompactPlayer ? 'is-compact' : ''}`}
        />
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
          className={`mp-progress-range ${isCompactPlayer ? 'is-compact' : ''}`}
        />
        <audio
          ref={audioRef}
          key={currentAudioUrl || 'empty'}
          src={currentAudioUrl || ''}
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
      )}
    </div>
  );
};

export default MusicPlayer;
