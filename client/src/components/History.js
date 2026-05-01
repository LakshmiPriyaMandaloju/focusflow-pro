import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import toast from 'react-hot-toast';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.getHistory();
      setSessions(data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filtered = sessions.filter(s => {
    if (filter === 'all')       return true;
    if (filter === 'completed') return s.status === 'completed';
    if (filter === 'broken')    return s.status === 'broken';
    return true;
  });

  const totalMinutes = sessions
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + s.actualDuration, 0);

  const avgScore = sessions.filter(s => s.status === 'completed').length > 0
    ? Math.round(
        sessions
          .filter(s => s.status === 'completed')
          .reduce((acc, s) => acc + s.focusScore, 0) /
        sessions.filter(s => s.status === 'completed').length
      )
    : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--green)';
    if (score >= 60) return '#6366f1';
    if (score >= 40) return 'var(--amber)';
    return 'var(--red)';
  };

  const getModeIcon = (mode) => {
    const icons = {
      pomodoro: '🍅', long: '🎯',
      short: '⚡',    deep: '🧠'
    };
    return icons[mode] || '⏱️';
  };

  if (loading) return (
    <div style={styles.loading}>
      <span style={{ fontSize: '3rem' }}>📋</span>
      <p>Loading history...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Session History</h2>

      {/* Summary */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryVal}>{sessions.length}</span>
          <span style={styles.summaryKey}>Total Sessions</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryVal}>{totalMinutes}m</span>
          <span style={styles.summaryKey}>Total Study Time</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={{ ...styles.summaryVal, color: getScoreColor(avgScore) }}>
            {avgScore}
          </span>
          <span style={styles.summaryKey}>Avg Focus Score</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={{ ...styles.summaryVal, color: 'var(--green)' }}>
            {sessions.filter(s => s.status === 'completed').length}
          </span>
          <span style={styles.summaryKey}>Completed</span>
        </div>
      </div>

      {/* Filter */}
      <div style={styles.filterRow}>
        {['all', 'completed', 'broken'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              ...(filter === f ? styles.filterBtnActive : {})
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Sessions */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <span style={{ fontSize: '3rem' }}>📋</span>
          <p>No sessions found</p>
        </div>
      ) : (
        <div style={styles.sessionList}>
          {filtered.map(session => (
            <div key={session._id} style={styles.sessionCard}>
              <div style={styles.sessionLeft}>
                <span style={styles.modeIcon}>
                  {getModeIcon(session.mode)}
                </span>
                <div>
                  <div style={styles.sessionTitle}>
                    {session.mode?.charAt(0).toUpperCase() +
                     session.mode?.slice(1)} Session
                    {session.goalId && (
                      <span style={styles.goalTag}>
                        🎯 {session.goalId.title}
                      </span>
                    )}
                  </div>
                  <div style={styles.sessionTime}>
                    {new Date(session.startTime).toLocaleDateString('en-IN', {
                      weekday: 'short', month: 'short',
                      day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div style={styles.sessionRight}>
                <div style={styles.sessionStats}>
                  <div style={styles.sessionStat}>
                    <span style={styles.sessionStatVal}>
                      {session.actualDuration}m
                    </span>
                    <span style={styles.sessionStatKey}>duration</span>
                  </div>
                  <div style={styles.sessionStat}>
                    <span style={{
                      ...styles.sessionStatVal,
                      color: getScoreColor(session.focusScore)
                    }}>
                      {session.focusScore}
                    </span>
                    <span style={styles.sessionStatKey}>score</span>
                  </div>
                  <div style={styles.sessionStat}>
                    <span style={{
                      ...styles.sessionStatVal,
                      color: 'var(--amber)'
                    }}>
                      +{session.xpEarned}
                    </span>
                    <span style={styles.sessionStatKey}>XP</span>
                  </div>
                </div>

                <span style={{
                  ...styles.statusBadge,
                  background: session.status === 'completed'
                    ? 'var(--green-soft)' : 'var(--red-soft)',
                  color: session.status === 'completed'
                    ? 'var(--green)' : 'var(--red)',
                  border: `1px solid ${session.status === 'completed'
                    ? 'var(--green)' : 'var(--red)'}`,
                }}>
                  {session.status === 'completed' ? '✓ Done' : '✗ Broken'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto' },
  loading: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '400px', gap: '1rem',
    color: 'var(--text-secondary)',
  },
  title: {
    fontSize: '1.5rem', fontWeight: '700',
    color: 'var(--text-primary)', marginBottom: '1.5rem',
  },
  summaryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem', marginBottom: '1.5rem',
  },
  summaryCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  summaryVal: {
    fontSize: '2rem', fontWeight: '700',
    color: 'var(--accent)',
  },
  summaryKey: {
    fontSize: '0.78rem', color: 'var(--text-muted)',
  },
  filterRow: {
    display: 'flex', gap: '8px', marginBottom: '1rem',
  },
  filterBtn: {
    padding: '6px 16px', borderRadius: '20px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem', cursor: 'pointer',
  },
  filterBtnActive: {
    background: 'var(--accent-soft)',
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
    fontWeight: '600',
  },
  empty: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '4rem', gap: '1rem',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
  },
  sessionList: {
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  sessionCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem 1.25rem',
    border: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionLeft: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  modeIcon: { fontSize: '1.5rem' },
  sessionTitle: {
    fontSize: '0.9rem', fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  goalTag: {
    fontSize: '0.75rem', color: 'var(--accent)',
    background: 'var(--accent-soft)',
    padding: '2px 8px', borderRadius: '10px',
  },
  sessionTime: {
    fontSize: '0.78rem', color: 'var(--text-muted)',
    marginTop: '2px',
  },
  sessionRight: {
    display: 'flex', alignItems: 'center', gap: '1.5rem',
  },
  sessionStats: {
    display: 'flex', gap: '1.5rem',
  },
  sessionStat: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '2px',
  },
  sessionStatVal: {
    fontSize: '1rem', fontWeight: '700',
    color: 'var(--text-primary)',
  },
  sessionStatKey: {
    fontSize: '0.7rem', color: 'var(--text-muted)',
  },
  statusBadge: {
    fontSize: '0.78rem', fontWeight: '600',
    padding: '4px 10px', borderRadius: '20px',
    whiteSpace: 'nowrap',
  },
};