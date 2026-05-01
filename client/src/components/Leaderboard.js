import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import toast from 'react-hot-toast';

export default function Leaderboard() {
  const { user }                = useAuth();
  const [leaders, setLeaders]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchLeaderboard(); }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.getLeaderboard();
      setLeaders(data);
    } catch {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 0) return { bg: '#FFD700', color: '#7D4E00' };
    if (rank === 1) return { bg: '#C0C0C0', color: '#3D3D3D' };
    if (rank === 2) return { bg: '#CD7F32', color: '#4A2800' };
    return { bg: 'var(--bg-secondary)', color: 'var(--text-muted)' };
  };

  const getRankIcon = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  const getLevel = (xp) => Math.floor(xp / 500) + 1;

  if (loading) return (
    <div style={styles.loading}>
      <span style={{ fontSize: '3rem' }}>🏆</span>
      <p>Loading leaderboard...</p>
    </div>
  );

  const userRank = leaders.findIndex(l => l._id === user?._id);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Leaderboard</h2>
        <button onClick={fetchLeaderboard} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {/* User Rank Card */}
      {userRank >= 0 && (
        <div style={styles.myRankCard}>
          <div style={styles.myRankLeft}>
            <span style={styles.myRankIcon}>
              {getRankIcon(userRank)}
            </span>
            <div>
              <p style={styles.myRankTitle}>Your Rank</p>
              <p style={styles.myRankSub}>
                Keep studying to climb higher!
              </p>
            </div>
          </div>
          <div style={styles.myRankRight}>
            <span style={styles.myXP}>{user?.xp || 0} XP</span>
            <span style={styles.myLevel}>
              Level {getLevel(user?.xp || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaders.length >= 3 && (
        <div style={styles.podium}>
          {[1, 0, 2].map(i => {
            const leader = leaders[i];
            const rank   = getRankStyle(i);
            if (!leader) return null;
            return (
              <div
                key={leader._id}
                style={{
                  ...styles.podiumItem,
                  ...(i === 0 ? styles.podiumFirst : {})
                }}
              >
                <div style={styles.podiumAvatar}>
                  {leader.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{
                  ...styles.podiumRank,
                  background: rank.bg,
                  color: rank.color
                }}>
                  {getRankIcon(i)}
                </div>
                <p style={styles.podiumName}>{leader.name}</p>
                <p style={styles.podiumXP}>{leader.xp} XP</p>
                <div style={{
                  ...styles.podiumBase,
                  height: i === 0 ? '60px' : i === 1 ? '44px' : '32px',
                  background: rank.bg,
                }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Full List */}
      <div style={styles.card}>
        <div style={styles.listHead}>
          <span style={styles.listHeadRank}>Rank</span>
          <span style={styles.listHeadName}>User</span>
          <span style={styles.listHeadXP}>XP</span>
          <span style={styles.listHeadLevel}>Level</span>
          <span style={styles.listHeadStreak}>Streak</span>
        </div>

        {leaders.map((leader, i) => {
          const isMe = leader._id === user?._id;
          const rank = getRankStyle(i);
          return (
            <div
              key={leader._id}
              style={{
                ...styles.listRow,
                ...(isMe ? styles.listRowMe : {})
              }}
            >
              <span style={{
                ...styles.rankBadge,
                background: rank.bg,
                color: rank.color
              }}>
                {getRankIcon(i)}
              </span>

              <div style={styles.userCell}>
                <div style={styles.avatar}>
                  {leader.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={styles.leaderName}>
                    {leader.name}
                    {isMe && (
                      <span style={styles.youBadge}>You</span>
                    )}
                  </p>
                  {leader.badges?.length > 0 && (
                    <p style={styles.leaderBadges}>
                      {leader.badges.slice(0, 3).map(b => b.icon).join(' ')}
                    </p>
                  )}
                </div>
              </div>

              <span style={styles.xpCell}>{leader.xp}</span>

              <span style={styles.levelCell}>
                Lv.{getLevel(leader.xp)}
              </span>

              <span style={styles.streakCell}>
                🔥 {leader.streak?.current || 0}d
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto' },
  loading: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '400px', gap: '1rem',
    color: 'var(--text-secondary)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.5rem', fontWeight: '700',
    color: 'var(--text-primary)',
  },
  refreshBtn: {
    padding: '8px 16px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem', cursor: 'pointer',
  },
  myRankCard: {
    background: 'linear-gradient(135deg, #1e1e2e, #1a1033)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.5rem',
    border: '1px solid var(--accent)',
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '1.5rem',
  },
  myRankLeft: {
    display: 'flex', alignItems: 'center', gap: '1rem',
  },
  myRankIcon: { fontSize: '2.5rem' },
  myRankTitle: {
    fontSize: '1rem', fontWeight: '600',
    color: 'var(--text-primary)',
  },
  myRankSub: {
    fontSize: '0.8rem', color: 'var(--text-muted)',
  },
  myRankRight: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'flex-end', gap: '4px',
  },
  myXP: {
    fontSize: '1.5rem', fontWeight: '700',
    color: 'var(--accent)',
  },
  myLevel: {
    fontSize: '0.8rem', color: 'var(--text-muted)',
  },
  podium: {
    display: 'flex', justifyContent: 'center',
    alignItems: 'flex-end', gap: '1rem',
    marginBottom: '1.5rem', padding: '1rem',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  podiumItem: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '6px', flex: 1,
  },
  podiumFirst: { transform: 'translateY(-16px)' },
  podiumAvatar: {
    width: '48px', height: '48px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.25rem', fontWeight: '700', color: '#fff',
  },
  podiumRank: {
    width: '28px', height: '28px', borderRadius: '50%',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '0.9rem',
    fontWeight: '700',
  },
  podiumName: {
    fontSize: '0.8rem', fontWeight: '600',
    color: 'var(--text-primary)', textAlign: 'center',
  },
  podiumXP: {
    fontSize: '0.75rem', color: 'var(--accent)',
    fontWeight: '600',
  },
  podiumBase: {
    width: '100%', borderRadius: '4px 4px 0 0',
  },
  card: {
    background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', overflow: 'hidden',
  },
  listHead: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr 80px 80px 80px',
    padding: '0.75rem 1.25rem',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    fontSize: '0.75rem', color: 'var(--text-muted)',
    fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  listHeadRank:   { textAlign: 'center' },
  listHeadName:   {},
  listHeadXP:     { textAlign: 'center' },
  listHeadLevel:  { textAlign: 'center' },
  listHeadStreak: { textAlign: 'center' },
  listRow: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr 80px 80px 80px',
    padding: '0.875rem 1.25rem',
    borderBottom: '1px solid var(--border)',
    alignItems: 'center',
    transition: 'background 0.2s',
  },
  listRowMe: {
    background: 'var(--accent-soft)',
    borderLeft: '3px solid var(--accent)',
  },
  rankBadge: {
    width: '32px', height: '32px',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: '700',
    margin: '0 auto',
  },
  userCell: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem', fontWeight: '700', color: '#fff',
    flexShrink: 0,
  },
  leaderName: {
    fontSize: '0.875rem', fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex', alignItems: 'center', gap: '6px',
  },
  youBadge: {
    fontSize: '0.65rem', padding: '1px 6px',
    background: 'var(--accent)', color: '#fff',
    borderRadius: '10px', fontWeight: '600',
  },
  leaderBadges: {
    fontSize: '0.75rem', marginTop: '2px',
  },
  xpCell: {
    textAlign: 'center', fontSize: '0.875rem',
    fontWeight: '600', color: 'var(--accent)',
  },
  levelCell: {
    textAlign: 'center', fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  streakCell: {
    textAlign: 'center', fontSize: '0.8rem',
    color: 'var(--amber)',
  },
};