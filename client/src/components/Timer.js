import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

const MODES = {
  pomodoro: { label: 'Pomodoro',   minutes: 25, color: '#6366f1' },
  long:     { label: 'Long Focus', minutes: 50, color: '#10b981' },
  short:    { label: 'Short',      minutes: 15, color: '#f59e0b' },
  deep:     { label: 'Deep Work',  minutes: 90, color: '#ef4444' },
};

const SOUNDS = {
  none:      { label: 'Silent',     src: null },
  rain:      { label: 'Rain',       src: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3' },
  cafe:      { label: 'Cafe',       src: 'https://assets.mixkit.co/active_storage/sfx/2516/2516-preview.mp3' },
  whitenoise:{ label: 'White Noise',src: 'https://assets.mixkit.co/active_storage/sfx/2517/2517-preview.mp3' },
};

export default function Timer({ onSessionEnd }) {
  const [mode, setMode]                   = useState('pomodoro');
  const [totalSecs, setTotalSecs]         = useState(25 * 60);
  const [remainingSecs, setRemainingSecs] = useState(25 * 60);
  const [isRunning, setIsRunning]         = useState(false);
  const [isPaused, setIsPaused]           = useState(false);
  const [, setSessionId] = useState(null);
  const [distractions, setDistractions]   = useState(0);
  const [sound, setSound]                 = useState('none');
  const [selectedGoal, setSelectedGoal]   = useState(null);
  const [goals, setGoals]                 = useState([]);
  const [showResult, setShowResult]       = useState(null);
  const intervalRef                       = useRef(null);
  const audioRef                          = useRef(null);

  useEffect(() => {
  fetchGoals();
  checkActiveSession();
  return () => clearInterval(intervalRef.current);
}, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
  if (remainingSecs <= 0 && isRunning) {
    handleComplete();
  }
}, [remainingSecs]); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchGoals = async () => {
    try {
      const { data } = await api.getGoals();
      setGoals(data);
    } catch (err) {
      console.log(err);
    }
  };

  const checkActiveSession = async () => {
    try {
      const { data } = await api.getActiveSession();
      if (data) {
        setSessionId(data._id);
        setIsRunning(true);
        const elapsed = Math.floor(
          (Date.now() - new Date(data.startTime)) / 1000
        );
        const planned = data.plannedDuration * 60;
        setTotalSecs(planned);
        setRemainingSecs(Math.max(planned - elapsed, 0));
        startTicking();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const startTicking = () => {
    intervalRef.current = setInterval(() => {
      setRemainingSecs(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStart = async () => {
    try {
      const { data } = await api.startSession({
        plannedDuration: MODES[mode].minutes,
        mode,
        goalId: selectedGoal || null,
      });
      setSessionId(data._id);
      setIsRunning(true);
      setIsPaused(false);
      setDistractions(0);
      setShowResult(null);
      startTicking();
      playSound();
      toast.success('Session started! Stay focused!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start');
    }
  };

  const handlePause = () => {
    if (isPaused) {
      startTicking();
      playSound();
      setIsPaused(false);
    } else {
      clearInterval(intervalRef.current);
      stopSound();
      setIsPaused(true);
    }
  };

  const handleEnd = async (status = 'broken') => {
    clearInterval(intervalRef.current);
    stopSound();
    try {
      const { data } = await api.endSession({
        status,
        distractionAttempts: distractions,
      });
      setIsRunning(false);
      setIsPaused(false);
      setSessionId(null);
      resetTimer(mode);
      setShowResult(data);
      if (status === 'completed') {
        toast.success(`Session complete! +${data.xpEarned} XP`);
      } else {
        toast.error('Session ended early');
      }
      if (onSessionEnd) onSessionEnd();
    } catch (err) {
      toast.error('Failed to end session');
    }
  };

  const handleComplete = () => {
    clearInterval(intervalRef.current);
    handleEnd('completed');
  };

  const resetTimer = (m) => {
    clearInterval(intervalRef.current);
    const secs = MODES[m].minutes * 60;
    setTotalSecs(secs);
    setRemainingSecs(secs);
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleModeChange = (m) => {
    if (isRunning) return;
    setMode(m);
    resetTimer(m);
  };

  const handleDistraction = async (site = 'unknown') => {
    setDistractions(prev => prev + 1);
    try {
      await api.trackDistraction({ siteURL: site });
    } catch (err) {
      console.log(err);
    }
    toast.error('Distraction tracked! Stay focused!');
  };

  const playSound = () => {
    if (sound !== 'none' && SOUNDS[sound].src) {
      if (audioRef.current) {
        audioRef.current.src   = SOUNDS[sound].src;
        audioRef.current.loop  = true;
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleSoundChange = (s) => {
    setSound(s);
    stopSound();
    if (isRunning && !isPaused && s !== 'none') {
      setTimeout(() => playSound(), 100);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const progress    = ((totalSecs - remainingSecs) / totalSecs) * 100;
  const circumference = 2 * Math.PI * 110;
  const strokeDash  = circumference - (progress / 100) * circumference;
  const modeColor   = MODES[mode].color;

  return (
    <div style={styles.container}>
      <audio ref={audioRef} />

      <div style={styles.grid}>
        {/* Timer Card */}
        <div style={styles.timerCard}>
          {/* Mode Tabs */}
          <div style={styles.modeTabs}>
            {Object.entries(MODES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => handleModeChange(key)}
                disabled={isRunning}
                style={{
                  ...styles.modeTab,
                  ...(mode === key ? {
                    background: `${modeColor}22`,
                    color: modeColor,
                    borderColor: modeColor,
                  } : {})
                }}
              >
                {val.label}
              </button>
            ))}
          </div>

          {/* Timer Circle */}
          <div style={styles.timerCircleWrap}>
            <svg width="260" height="260" style={styles.svg}>
              <circle
                cx="130" cy="130" r="110"
                fill="none"
                stroke="var(--border)"
                strokeWidth="8"
              />
              <circle
                cx="130" cy="130" r="110"
                fill="none"
                stroke={modeColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDash}
                transform="rotate(-90 130 130)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={styles.timerInner}>
              <span style={{ ...styles.timeText, color: modeColor }}>
                {formatTime(remainingSecs)}
              </span>
              <span style={styles.timeStatus}>
                {!isRunning ? MODES[mode].label :
                 isPaused   ? 'Paused' : 'Focusing...'}
              </span>
              {isRunning && (
                <span style={styles.distractionBadge}>
                  ⚠️ {distractions} distractions
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            {!isRunning ? (
              <button onClick={handleStart} style={{
                ...styles.startBtn,
                background: `linear-gradient(135deg, ${modeColor}, ${modeColor}aa)`
              }}>
                Start Session
              </button>
            ) : (
              <div style={styles.controlRow}>
                <button onClick={handlePause} style={styles.pauseBtn}>
                  {isPaused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <button onClick={() => handleEnd('broken')} style={styles.endBtn}>
                  End Early
                </button>
              </div>
            )}
          </div>

          {/* Sound Engine */}
          <div style={styles.soundEngine}>
            <span style={styles.soundLabel}>Focus Sound</span>
            <div style={styles.soundBtns}>
              {Object.entries(SOUNDS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => handleSoundChange(key)}
                  style={{
                    ...styles.soundBtn,
                    ...(sound === key ? styles.soundBtnActive : {})
                  }}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={styles.rightPanel}>
          {/* Goal Selector */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Study Goal</h3>
            <select
              value={selectedGoal || ''}
              onChange={e => setSelectedGoal(e.target.value || null)}
              disabled={isRunning}
              style={styles.select}
            >
              <option value="">No specific goal</option>
              {goals.map(g => (
                <option key={g._id} value={g._id}>
                  {g.title} ({g.progressPercent}%)
                </option>
              ))}
            </select>
          </div>

          {/* Distraction Tracker */}
          {isRunning && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Distraction Tracker</h3>
              <p style={styles.cardSub}>
                Tempted to visit a site? Click to track it.
              </p>
              <div style={styles.distractionSites}>
                {['YouTube', 'Instagram', 'Twitter', 'Reddit', 'Netflix'].map(site => (
                  <button
                    key={site}
                    onClick={() => handleDistraction(site.toLowerCase() + '.com')}
                    style={styles.distractionBtn}
                  >
                    {site}
                  </button>
                ))}
              </div>
              <div style={styles.distractionCount}>
                <span style={styles.distractionNum}>{distractions}</span>
                <span style={styles.distractionLabel}>attempts today</span>
              </div>
            </div>
          )}

          {/* Session Result */}
          {showResult && (
            <div style={styles.resultCard}>
              <h3 style={styles.resultTitle}>Session Complete!</h3>
              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <span style={styles.resultVal}>
                    {showResult.focusScore}
                  </span>
                  <span style={styles.resultKey}>Focus Score</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={{ ...styles.resultVal, color: '#f59e0b' }}>
                    +{showResult.xpEarned}
                  </span>
                  <span style={styles.resultKey}>XP Earned</span>
                </div>
                <div style={styles.resultItem}>
                  <span style={{ ...styles.resultVal, color: '#10b981' }}>
                    {showResult.streak}
                  </span>
                  <span style={styles.resultKey}>Day Streak</span>
                </div>
              </div>
              {showResult.newBadges?.length > 0 && (
                <div style={styles.badgesRow}>
                  {showResult.newBadges.map((b, i) => (
                    <div key={i} style={styles.badge}>
                      <span>{b.icon}</span>
                      <span style={styles.badgeName}>{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {!isRunning && !showResult && (
            <div style={styles.tipCard}>
              <h3 style={styles.cardTitle}>Focus Tips</h3>
              {[
                '📵 Put your phone face down',
                '💧 Keep water nearby',
                '🎯 Set a clear goal before starting',
                '🔕 Turn off notifications',
              ].map((tip, i) => (
                <div key={i} style={styles.tip}>{tip}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto' },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '1.5rem',
  },
  timerCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    border: '1px solid var(--border)',
  },
  modeTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  modeTab: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  timerCircleWrap: {
    position: 'relative',
    width: '260px',
    height: '260px',
    margin: '0 auto 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: { position: 'absolute', top: 0, left: 0 },
  timerInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    zIndex: 1,
  },
  timeText: {
    fontSize: '3.5rem',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-2px',
    lineHeight: 1,
  },
  timeStatus: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  distractionBadge: {
    fontSize: '0.75rem',
    color: 'var(--amber)',
    background: 'var(--amber-soft)',
    padding: '2px 8px',
    borderRadius: '10px',
    marginTop: '4px',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  startBtn: {
    padding: '0.85rem 3rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  controlRow: {
    display: 'flex',
    gap: '12px',
  },
  pauseBtn: {
    padding: '0.85rem 2rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--amber)',
    background: 'var(--amber-soft)',
    color: 'var(--amber)',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  endBtn: {
    padding: '0.85rem 2rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--red)',
    background: 'var(--red-soft)',
    color: 'var(--red)',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  soundEngine: {
    borderTop: '1px solid var(--border)',
    paddingTop: '1.25rem',
  },
  soundLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
    display: 'block',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  soundBtns: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  soundBtn: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  soundBtnActive: {
    background: 'var(--accent-soft)',
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  card: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    border: '1px solid var(--border)',
  },
  cardTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardSub: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginBottom: '0.75rem',
  },
  select: {
    width: '100%',
    padding: '0.65rem 0.75rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    cursor: 'pointer',
  },
  distractionSites: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '1rem',
  },
  distractionBtn: {
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid var(--red)',
    background: 'var(--red-soft)',
    color: 'var(--red)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
  distractionCount: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  distractionNum: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--red)',
  },
  distractionLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  resultCard: {
    background: 'linear-gradient(135deg, #1e1e2e, #1a1033)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--accent)',
  },
  resultTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--accent)',
    marginBottom: '1rem',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '1rem',
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  resultVal: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--accent)',
  },
  resultKey: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  badgesRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    background: 'var(--amber-soft)',
    borderRadius: '20px',
    border: '1px solid var(--amber)',
  },
  badgeName: {
    fontSize: '0.75rem',
    color: 'var(--amber)',
    fontWeight: '600',
  },
  tipCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    border: '1px solid var(--border)',
  },
  tip: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--border)',
  },
};