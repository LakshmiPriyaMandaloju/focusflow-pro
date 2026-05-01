import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import * as api from '../services/api';
import toast from 'react-hot-toast';

export default function Stats({ stats, onRefresh }) {
  const [weekly, setWeekly]   = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [weekRes, heatRes] = await Promise.all([
        api.getWeeklyReport(),
        api.getHeatmap()
      ]);
      setWeekly(weekRes.data);
      setHeatmap(heatRes.data);
    } catch (err) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAll();
    if (onRefresh) onRefresh();
  };

  if (loading) return (
    <div style={styles.loading}>
      <span style={styles.loadingIcon}>📊</span>
      <p>Loading analytics...</p>
    </div>
  );

  const weekChartData = stats?.weekData || [];
  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    minutes: stats?.heatmapData?.[i] || 0
  }));

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--green)';
    if (score >= 60) return '#6366f1';
    if (score >= 40) return 'var(--amber)';
    return 'var(--red)';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Analytics</h2>
        <button onClick={handleRefresh} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {/* Top Stats */}
      <div style={styles.statGrid}>
        {[
          {
            icon: '⏱️',
            label: 'Total Study Time',
            value: `${stats?.totalStudyTime || 0}m`,
            sub: `${Math.floor((stats?.totalStudyTime || 0) / 60)}h total`,
            color: '#6366f1'
          },
          {
            icon: '🎯',
            label: 'Focus Score',
            value: stats?.avgFocusScore || 0,
            sub: 'average score',
            color: getScoreColor(stats?.avgFocusScore || 0)
          },
          {
            icon: '🔥',
            label: 'Streak',
            value: `${stats?.streak || 0}d`,
            sub: `best: ${stats?.longestStreak || 0} days`,
            color: 'var(--amber)'
          },
          {
            icon: '✅',
            label: 'Sessions',
            value: stats?.completedSessions || 0,
            sub: `${stats?.brokenSessions || 0} broken`,
            color: 'var(--green)'
          },
          {
            icon: '⚡',
            label: 'Total XP',
            value: stats?.xp || 0,
            sub: `Level ${stats?.level || 1}`,
            color: '#a855f7'
          },
          {
            icon: '⚠️',
            label: 'Distractions',
            value: stats?.totalDistractions || 0,
            sub: 'total attempts',
            color: 'var(--red)'
          },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={styles.statTop}>
              <span style={styles.statIcon}>{s.icon}</span>
              <span style={{ ...styles.statValue, color: s.color }}>
                {s.value}
              </span>
            </div>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly Chart */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Weekly Focus Minutes</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weekChartData}>
            <defs>
              <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorMinutes)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Heatmap */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Peak Focus Hours</h3>
        <p style={styles.cardSub}>
          Best time: {stats?.peakHour !== undefined
            ? `${stats.peakHour}:00 - ${stats.peakHour + 1}:00`
            : 'No data yet'}
        </p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={hourData.filter((_, i) => i % 2 === 0)}>
            <XAxis
              dataKey="hour"
              stroke="var(--text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            />
            <Bar
              dataKey="minutes"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Report */}
      {weekly && (
        <div style={styles.reportCard}>
          <h3 style={styles.cardTitle}>Weekly Report</h3>
          <div style={styles.reportGrid}>
            <div style={styles.reportItem}>
              <span style={styles.reportVal}>{weekly.totalMinutes}m</span>
              <span style={styles.reportKey}>Total study</span>
            </div>
            <div style={styles.reportItem}>
              <span style={styles.reportVal}>{weekly.completedSessions}</span>
              <span style={styles.reportKey}>Sessions done</span>
            </div>
            <div style={styles.reportItem}>
              <span style={styles.reportVal}>{weekly.avgScore}</span>
              <span style={styles.reportKey}>Avg score</span>
            </div>
            <div style={styles.reportItem}>
              <span style={styles.reportVal}>{weekly.bestDay}</span>
              <span style={styles.reportKey}>Best day</span>
            </div>
          </div>
          <div style={styles.reportMessage}>
            {weekly.message}
          </div>
        </div>
      )}

      {/* Badges */}
      {stats?.badges?.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Earned Badges</h3>
          <div style={styles.badgesGrid}>
            {stats.badges.map((badge, i) => (
              <div key={i} style={styles.badge}>
                <span style={styles.badgeIcon}>{badge.icon}</span>
                <span style={styles.badgeName}>{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto' },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '1rem',
    color: 'var(--text-secondary)',
  },
  loadingIcon: { fontSize: '3rem' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  refreshBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    border: '1px solid var(--border)',
  },
  statTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  statIcon: { fontSize: '1.25rem' },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: '700',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    marginBottom: '2px',
  },
  statSub: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  card: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--border)',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardSub: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginBottom: '1rem',
  },
  reportCard: {
    background: 'linear-gradient(135deg, #1e1e2e, #1a1033)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--accent)',
    marginBottom: '1rem',
  },
  reportGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    margin: '1rem 0',
  },
  reportItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  reportVal: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--accent)',
  },
  reportKey: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  reportMessage: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    borderTop: '1px solid var(--border)',
    paddingTop: '1rem',
    marginTop: '0.5rem',
  },
  badgesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    background: 'var(--amber-soft)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--amber)',
  },
  badgeIcon: { fontSize: '1.25rem' },
  badgeName: {
    fontSize: '0.8rem',
    color: 'var(--amber)',
    fontWeight: '600',
  },
};