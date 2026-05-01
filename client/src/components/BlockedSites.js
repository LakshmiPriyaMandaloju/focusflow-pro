import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import toast from 'react-hot-toast';

const PROFILES = {
  normal:   { label: 'Normal',   desc: 'Standard blocking',        color: '#6366f1', icon: '🛡️'  },
  strict:   { label: 'Strict',   desc: 'No exceptions allowed',    color: '#f59e0b', icon: '⚠️'  },
  hardcore: { label: 'Hardcore', desc: 'Maximum focus mode',       color: '#ef4444', icon: '🔥'  },
};

const POPULAR = [
  'youtube.com', 'instagram.com', 'twitter.com',
  'facebook.com', 'netflix.com',  'reddit.com',
  'tiktok.com',   'snapchat.com', 'discord.com',
];

export default function BlockedSites() {
  const [sites, setSites]           = useState([]);
  const [profile, setProfile]       = useState('normal');
  const [breakAttempts, setBreakAttempts] = useState(0);
  const [siteInput, setSiteInput]   = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.getSites();
      setSites(data.sites);
      setProfile(data.blockingProfile);
      setBreakAttempts(data.breakAttempts);
    } catch {
      toast.error('Failed to load blocking data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (url) => {
    const site = (url || siteInput).trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!site) return;
    try {
      await api.addSite({ siteURL: site });
      setSiteInput('');
      fetchData();
      toast.success(`${site} blocked!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add site');
    }
  };

  const handleRemove = async (id, url) => {
    try {
      await api.removeSite(id);
      fetchData();
      toast.success(`${url} unblocked`);
    } catch {
      toast.error('Failed to remove site');
    }
  };

  const handleProfileChange = async (p) => {
    try {
      await api.updateProfile({ profile: p });
      setProfile(p);
      toast.success(`Switched to ${PROFILES[p].label} mode`);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleReset = async () => {
    try {
      await api.resetAttempts();
      setBreakAttempts(0);
      setProfile('normal');
      toast.success('Break attempts reset!');
    } catch {
      toast.error('Failed to reset');
    }
  };

  if (loading) return (
    <div style={styles.loading}>
      <span style={{ fontSize: '3rem' }}>📵</span>
      <p>Loading blocking settings...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Site Blocking</h2>

      {/* Blocking Profile */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Blocking Profile</h3>
        <div style={styles.profileGrid}>
          {Object.entries(PROFILES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => handleProfileChange(key)}
              style={{
                ...styles.profileBtn,
                ...(profile === key ? {
                  borderColor: val.color,
                  background: `${val.color}15`,
                } : {})
              }}
            >
              <span style={styles.profileIcon}>{val.icon}</span>
              <span style={{
                ...styles.profileLabel,
                color: profile === key ? val.color : 'var(--text-primary)'
              }}>
                {val.label}
              </span>
              <span style={styles.profileDesc}>{val.desc}</span>
            </button>
          ))}
        </div>

        {breakAttempts > 0 && (
          <div style={styles.warningBanner}>
            <span>⚠️ You have {breakAttempts} break attempts.</span>
            {breakAttempts >= 3 && (
              <span style={styles.warningText}>
                Strict mode auto-activated!
              </span>
            )}
            <button onClick={handleReset} style={styles.resetBtn}>
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Add Site */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Block a Site</h3>
        <div style={styles.inputRow}>
          <input
            value={siteInput}
            onChange={e => setSiteInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. youtube.com"
            style={styles.input}
          />
          <button onClick={() => handleAdd()} style={styles.addBtn}>
            Block
          </button>
        </div>

        <div style={styles.quickSection}>
          <p style={styles.quickLabel}>Quick add popular sites:</p>
          <div style={styles.quickGrid}>
            {POPULAR.filter(
              s => !sites.find(b => b.siteURL === s)
            ).map(site => (
              <button
                key={site}
                onClick={() => handleAdd(site)}
                style={styles.quickBtn}
              >
                + {site}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blocked List */}
      <div style={styles.card}>
        <div style={styles.listHeader}>
          <h3 style={styles.cardTitle}>
            Blocked Sites ({sites.length})
          </h3>
        </div>

        {sites.length === 0 ? (
          <div style={styles.empty}>
            No sites blocked yet. Add some above!
          </div>
        ) : (
          <div style={styles.siteList}>
            {sites.map(site => (
              <div key={site._id} style={styles.siteRow}>
                <div style={styles.siteInfo}>
                  <span style={styles.siteIcon}>🚫</span>
                  <div>
                    <span style={styles.siteURL}>{site.siteURL}</span>
                    {site.attemptCount > 0 && (
                      <span style={styles.attemptBadge}>
                        {site.attemptCount} attempts
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(site._id, site.siteURL)}
                  style={styles.removeBtn}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={styles.infoCard}>
        <h3 style={styles.cardTitle}>How Blocking Works</h3>
        <div style={styles.infoList}>
          {[
            { icon: '🌐', text: 'Web app shows warning when visiting blocked sites during sessions' },
            { icon: '⚡', text: 'Chrome Extension enables real browser-level blocking' },
            { icon: '🔄', text: '3 early session breaks triggers automatic Strict mode' },
            { icon: '📊', text: 'All distraction attempts are tracked and shown in Analytics' },
          ].map((item, i) => (
            <div key={i} style={styles.infoItem}>
              <span style={styles.infoIcon}>{item.icon}</span>
              <span style={styles.infoText}>{item.text}</span>
            </div>
          ))}
        </div>
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
  title: {
    fontSize: '1.5rem', fontWeight: '700',
    color: 'var(--text-primary)', marginBottom: '1.5rem',
  },
  card: {
    background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
    padding: '1.5rem', border: '1px solid var(--border)',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '0.875rem', fontWeight: '600',
    color: 'var(--text-primary)', marginBottom: '1rem',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  profileGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  profileBtn: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '6px',
    padding: '1rem', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'transparent', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  profileIcon: { fontSize: '1.5rem' },
  profileLabel: {
    fontSize: '0.875rem', fontWeight: '600',
  },
  profileDesc: {
    fontSize: '0.75rem', color: 'var(--text-muted)',
    textAlign: 'center',
  },
  warningBanner: {
    display: 'flex', alignItems: 'center',
    gap: '12px', marginTop: '1rem',
    padding: '0.75rem 1rem',
    background: 'var(--amber-soft)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--amber)',
    fontSize: '0.85rem', color: 'var(--amber)',
  },
  warningText: { flex: 1, fontWeight: '600' },
  resetBtn: {
    padding: '4px 12px', borderRadius: '6px',
    border: '1px solid var(--amber)',
    background: 'transparent', color: 'var(--amber)',
    fontSize: '0.8rem', cursor: 'pointer',
  },
  inputRow: {
    display: 'flex', gap: '8px', marginBottom: '1rem',
  },
  input: {
    flex: 1, padding: '0.65rem 0.875rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem', outline: 'none',
  },
  addBtn: {
    padding: '0.65rem 1.25rem',
    borderRadius: 'var(--radius)', border: 'none',
    background: 'var(--red)', color: '#fff',
    fontSize: '0.875rem', fontWeight: '600',
    cursor: 'pointer',
  },
  quickSection: { marginTop: '0.5rem' },
  quickLabel: {
    fontSize: '0.78rem', color: 'var(--text-muted)',
    marginBottom: '0.5rem',
  },
  quickGrid: {
    display: 'flex', flexWrap: 'wrap', gap: '6px',
  },
  quickBtn: {
    padding: '4px 10px', borderRadius: '20px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem', cursor: 'pointer',
    fontFamily: 'monospace',
  },
  listHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center', padding: '2rem',
    color: 'var(--text-muted)', fontSize: '0.9rem',
  },
  siteList: {
    display: 'flex', flexDirection: 'column', gap: '0',
  },
  siteRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '0.75rem 0',
    borderBottom: '1px solid var(--border)',
  },
  siteInfo: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  siteIcon: { fontSize: '1rem' },
  siteURL: {
    fontSize: '0.875rem', fontFamily: 'monospace',
    color: 'var(--text-primary)', fontWeight: '500',
  },
  attemptBadge: {
    display: 'inline-block', marginLeft: '8px',
    fontSize: '0.7rem', padding: '2px 6px',
    background: 'var(--red-soft)', color: 'var(--red)',
    borderRadius: '10px',
  },
  removeBtn: {
    padding: '4px 12px', borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.78rem', cursor: 'pointer',
  },
  infoCard: {
    background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
    padding: '1.5rem', border: '1px solid var(--border)',
  },
  infoList: {
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
  },
  infoItem: {
    display: 'flex', gap: '12px', alignItems: 'flex-start',
  },
  infoIcon: { fontSize: '1rem', flexShrink: 0, marginTop: '2px' },
  infoText: {
    fontSize: '0.85rem', color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
};