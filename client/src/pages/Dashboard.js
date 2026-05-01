import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Timer from '../components/Timer';
import Stats from '../components/Stats';
import Goals from '../components/Goals';
import BlockedSites from '../components/BlockedSites';
import History from '../components/History';
import Leaderboard from '../components/Leaderboard';

const NAV_ITEMS = [
  { id: 'timer',       label: 'Focus Timer',  icon: '⏱️',  path: '/'           },
  { id: 'stats',       label: 'Analytics',    icon: '📊',  path: '/stats'      },
  { id: 'goals',       label: 'Goals',        icon: '🎯',  path: '/goals'      },
  { id: 'blocking',    label: 'Blocking',     icon: '📵',  path: '/blocking'   },
  { id: 'history',     label: 'History',      icon: '📋',  path: '/history'    },
  { id: 'leaderboard', label: 'Leaderboard',  icon: '🏆',  path: '/leaderboard'},
];

export default function Dashboard() {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [stats, setStats]   = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await api.getStats();
      setStats(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const getLevel = (xp) => Math.floor(xp / 500) + 1;
  const getXPProgress = (xp) => ((xp % 500) / 500) * 100;

  const activePath = location.pathname;

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: collapsed ? '72px' : '240px' }}>
        <div style={styles.sidebarTop}>
          <div style={styles.brand} onClick={() => setCollapsed(!collapsed)}>
            <span style={styles.brandIcon}>⚡</span>
            {!collapsed && (
              <span style={styles.brandName}>FocusFlow</span>
            )}
          </div>

          {!collapsed && user && (
            <div style={styles.userCard}>
              <div style={styles.userAvatar}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={styles.userInfo}>
                <span style={styles.userName}>{user.name}</span>
                <span style={styles.userLevel}>
                  Level {getLevel(user.xp || 0)}
                </span>
              </div>
            </div>
          )}

          {!collapsed && (
            <div style={styles.xpBar}>
              <div style={styles.xpBarTop}>
                <span style={styles.xpLabel}>XP</span>
                <span style={styles.xpValue}>{user?.xp || 0}</span>
              </div>
              <div style={styles.xpTrack}>
                <div style={{
                  ...styles.xpFill,
                  width: `${getXPProgress(user?.xp || 0)}%`
                }} />
              </div>
            </div>
          )}
        </div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map(item => {
            const isActive = activePath === item.path ||
              (item.path !== '/' && activePath.startsWith(item.path));
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start'
                }}
                title={collapsed ? item.label : ''}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {!collapsed && (
                  <span style={styles.navLabel}>{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarBottom}>
          {!collapsed && stats && (
            <div style={styles.streakBadge}>
              <span>🔥</span>
              <span style={styles.streakText}>
                {stats.streak} day streak
              </span>
            </div>
          )}
          <button
            onClick={logout}
            style={{
              ...styles.logoutBtn,
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}
          >
            <span>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <h1 style={styles.pageTitle}>
              {NAV_ITEMS.find(n =>
                n.path === activePath ||
                (n.path !== '/' && activePath.startsWith(n.path))
              )?.label || 'Focus Timer'}
            </h1>
          </div>
          <div style={styles.topBarRight}>
            {stats && (
              <>
                <div style={styles.topStat}>
                  <span style={styles.topStatIcon}>🔥</span>
                  <span style={styles.topStatVal}>{stats.streak}</span>
                </div>
                <div style={styles.topStat}>
                  <span style={styles.topStatIcon}>⚡</span>
                  <span style={styles.topStatVal}>{user?.xp || 0} XP</span>
                </div>
                <div style={styles.topStat}>
                  <span style={styles.topStatIcon}>🏅</span>
                  <span style={styles.topStatVal}>
                    Lv.{getLevel(user?.xp || 0)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div style={styles.content}>
          <Routes>
            <Route path="/"            element={<Timer onSessionEnd={fetchStats} />} />
            <Route path="/stats"       element={<Stats stats={stats} onRefresh={fetchStats} />} />
            <Route path="/goals"       element={<Goals />} />
            <Route path="/blocking"    element={<BlockedSites />} />
            <Route path="/history"     element={<History />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
  },
  sidebar: {
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    top: 0,
    left: 0,
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    zIndex: 100,
  },
  sidebarTop: {
    padding: '1.25rem 1rem',
    borderBottom: '1px solid var(--border)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    marginBottom: '1.25rem',
    padding: '4px',
  },
  brandIcon: { fontSize: '1.5rem' },
  brandName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    whiteSpace: 'nowrap',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '1rem',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#fff',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userLevel: {
    fontSize: '0.75rem',
    color: 'var(--accent)',
    fontWeight: '500',
  },
  xpBar: {
    marginTop: '0.5rem',
  },
  xpBarTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  xpLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  xpValue: {
    fontSize: '0.7rem',
    color: 'var(--accent)',
    fontWeight: '600',
  },
  xpTrack: {
    height: '4px',
    background: 'var(--border)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #a855f7)',
    borderRadius: '2px',
    transition: 'width 0.5s ease',
  },
  nav: {
    flex: 1,
    padding: '0.75rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0.65rem 0.75rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  navItemActive: {
    background: 'var(--accent-soft)',
    color: 'var(--accent)',
    fontWeight: '600',
  },
  navIcon: { fontSize: '1.1rem', flexShrink: 0 },
  navLabel: { fontWeight: '500' },
  sidebarBottom: {
    padding: '1rem',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  streakBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0.5rem 0.75rem',
    background: 'var(--amber-soft)',
    borderRadius: 'var(--radius)',
    fontSize: '0.8rem',
    color: 'var(--amber)',
    fontWeight: '600',
  },
  streakText: { whiteSpace: 'nowrap' },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0.65rem 0.75rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s',
  },
  main: {
    marginLeft: '240px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 2rem',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  topBarLeft: {},
  pageTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  topStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'var(--bg-card)',
    borderRadius: '20px',
    border: '1px solid var(--border)',
  },
  topStatIcon: { fontSize: '1rem' },
  topStatVal: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  content: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
  },
};