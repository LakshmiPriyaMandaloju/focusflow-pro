import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import toast from 'react-hot-toast';

export default function AIAssistant() {
  const [advice, setAdvice]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState('advice');
  const [mood, setMood]           = useState(7);
  const [energy, setEnergy]       = useState(7);
  const [moodResult, setMoodResult]   = useState(null);
  const [planForm, setPlanForm]       = useState({
    subject: '', targetDate: '', dailyHours: 2
  });
  const [studyPlan, setStudyPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [moodLoading, setMoodLoading] = useState(false);

  useEffect(() => {
    fetchAdvice();
  }, []);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const { data } = await api.getAIAdvice();
      setAdvice(data);
    } catch {
      toast.error('Failed to load AI advice');
    } finally {
      setLoading(false);
    }
  };

  const handleMoodAnalysis = async () => {
    setMoodLoading(true);
    try {
      const { data } = await api.analyzeMood({ mood, energy });
      setMoodResult(data);
    } catch {
      toast.error('Failed to analyze mood');
    } finally {
      setMoodLoading(false);
    }
  };

  const handleStudyPlan = async () => {
    if (!planForm.subject || !planForm.targetDate) {
      return toast.error('Please fill all fields');
    }
    setPlanLoading(true);
    try {
      const { data } = await api.getStudyPlan(planForm);
      setStudyPlan(data);
    } catch {
      toast.error('Failed to generate plan');
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>AI Focus Assistant</h2>
          <p style={styles.subtitle}>Powered by Claude AI</p>
        </div>
        <div style={styles.aiBadge}>
          <span>🧠</span>
          <span>AI</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { id: 'advice', label: '💡 Insights',   },
          { id: 'mood',   label: '😊 Mood Check'  },
          { id: 'plan',   label: '📅 Study Plan'  },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Advice Tab */}
      {activeTab === 'advice' && (
        <div>
          {loading ? (
            <div style={styles.loadingCard}>
              <div style={styles.loadingIcon}>🧠</div>
              <p style={styles.loadingText}>
                AI is analyzing your study patterns...
              </p>
            </div>
          ) : advice ? (
            <div>
              <div style={styles.adviceCard}>
                <div style={styles.adviceHeader}>
                  <span style={styles.adviceIcon}>⚡</span>
                  <span style={styles.adviceTitle}>
                    Personalized Insights
                  </span>
                </div>
                <p style={styles.adviceText}>{advice.advice}</p>
              </div>

              <div style={styles.statsRow}>
                {[
                  {
                    label: 'Focus Score',
                    value: advice.stats?.avgFocusScore || 0,
                    icon: '🎯',
                    color: '#6366f1'
                  },
                  {
                    label: 'Completed',
                    value: advice.stats?.completedSessions || 0,
                    icon: '✅',
                    color: '#10b981'
                  },
                  {
                    label: 'Streak',
                    value: `${advice.stats?.streak || 0}d`,
                    icon: '🔥',
                    color: '#f59e0b'
                  },
                  {
                    label: 'Distractions',
                    value: advice.stats?.totalDistractions || 0,
                    icon: '⚠️',
                    color: '#ef4444'
                  },
                ].map((stat, i) => (
                  <div key={i} style={styles.statCard}>
                    <span style={styles.statIcon}>{stat.icon}</span>
                    <span style={{
                      ...styles.statValue,
                      color: stat.color
                    }}>
                      {stat.value}
                    </span>
                    <span style={styles.statLabel}>{stat.label}</span>
                  </div>
                ))}
              </div>

              <button onClick={fetchAdvice} style={styles.refreshBtn}>
                🔄 Refresh Insights
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Mood Tab */}
      {activeTab === 'mood' && (
        <div style={styles.moodCard}>
          <h3 style={styles.cardTitle}>How are you feeling right now?</h3>

          <div style={styles.sliderGroup}>
            <div style={styles.sliderLabel}>
              <span>😊 Mood</span>
              <span style={styles.sliderValue}>{mood}/10</span>
            </div>
            <input
              type="range"
              min="1" max="10"
              value={mood}
              onChange={e => setMood(parseInt(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.sliderHints}>
              <span>Terrible</span>
              <span>Amazing</span>
            </div>
          </div>

          <div style={styles.sliderGroup}>
            <div style={styles.sliderLabel}>
              <span>⚡ Energy</span>
              <span style={styles.sliderValue}>{energy}/10</span>
            </div>
            <input
              type="range"
              min="1" max="10"
              value={energy}
              onChange={e => setEnergy(parseInt(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.sliderHints}>
              <span>Exhausted</span>
              <span>Energized</span>
            </div>
          </div>

          <button
            onClick={handleMoodAnalysis}
            disabled={moodLoading}
            style={moodLoading ? styles.btnDisabled : styles.btn}
          >
            {moodLoading ? 'Analyzing...' : '🧠 Get AI Recommendation'}
          </button>

          {moodResult && (
            <div style={styles.moodResult}>
              <p style={styles.moodMessage}>{moodResult.message}</p>
              <div style={styles.moodStats}>
                <div style={styles.moodStat}>
                  <span style={styles.moodStatVal}>
                    {moodResult.sessionDuration}m
                  </span>
                  <span style={styles.moodStatKey}>Session Duration</span>
                </div>
                <div style={styles.moodStat}>
                  <span style={styles.moodStatVal}>
                    {moodResult.mode}
                  </span>
                  <span style={styles.moodStatKey}>Recommended Mode</span>
                </div>
                <div style={styles.moodStat}>
                  <span style={styles.moodStatVal}>
                    {moodResult.takeBreakFirst ? 'Yes' : 'No'}
                  </span>
                  <span style={styles.moodStatKey}>Take Break First</span>
                </div>
              </div>
              <div style={styles.moodTip}>
                💡 {moodResult.tip}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Study Plan Tab */}
      {activeTab === 'plan' && (
        <div style={styles.planCard}>
          <h3 style={styles.cardTitle}>Generate AI Study Plan</h3>

          <div style={styles.formGroup}>
            <label style={styles.label}>Subject / Goal</label>
            <input
              value={planForm.subject}
              onChange={e => setPlanForm({
                ...planForm, subject: e.target.value
              })}
              placeholder="e.g. Complete DSA, Learn React, GATE Prep"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Target Date</label>
            <input
              type="date"
              value={planForm.targetDate}
              onChange={e => setPlanForm({
                ...planForm, targetDate: e.target.value
              })}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Daily Available Hours: {planForm.dailyHours}h
            </label>
            <input
              type="range"
              min="1" max="12"
              value={planForm.dailyHours}
              onChange={e => setPlanForm({
                ...planForm, dailyHours: parseInt(e.target.value)
              })}
              style={styles.slider}
            />
          </div>

          <button
            onClick={handleStudyPlan}
            disabled={planLoading}
            style={planLoading ? styles.btnDisabled : styles.btn}
          >
            {planLoading
              ? '🧠 AI is planning...'
              : '🚀 Generate Study Plan'}
          </button>

          {studyPlan && (
            <div style={styles.planResult}>
              <h3 style={styles.planTitle}>
                {studyPlan.title || 'Your Study Plan'}
              </h3>
              <p style={styles.planOverview}>{studyPlan.overview}</p>

              {studyPlan.weeklyPlan?.map((week, i) => (
                <div key={i} style={styles.weekCard}>
                  <div style={styles.weekHeader}>
                    <span style={styles.weekNum}>Week {week.week}</span>
                    <span style={styles.weekFocus}>{week.focus}</span>
                  </div>
                  <div style={styles.weekDetails}>
                    <span style={styles.weekStat}>
                      ⏱️ {week.sessionDuration}m sessions
                    </span>
                    <span style={styles.weekStat}>
                      📅 {week.sessionsPerDay}x daily
                    </span>
                  </div>
                  {week.dailyTasks?.map((task, j) => (
                    <div key={j} style={styles.task}>
                      <span style={styles.taskDot}>▸</span>
                      <span style={styles.taskText}>{task}</span>
                    </div>
                  ))}
                </div>
              ))}

              {studyPlan.milestones?.length > 0 && (
                <div style={styles.milestones}>
                  <h4 style={styles.milestonesTitle}>🏆 Milestones</h4>
                  {studyPlan.milestones.map((m, i) => (
                    <div key={i} style={styles.milestone}>
                      <span style={styles.milestoneDot}>✓</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}

              {studyPlan.tips?.length > 0 && (
                <div style={styles.tips}>
                  <h4 style={styles.tipsTitle}>💡 Tips</h4>
                  {studyPlan.tips.map((tip, i) => (
                    <div key={i} style={styles.tip}>{tip}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto' },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.5rem', fontWeight: '700',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '0.8rem', color: 'var(--text-muted)',
    marginTop: '2px',
  },
  aiBadge: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    borderRadius: '20px', fontSize: '0.875rem',
    fontWeight: '600', color: '#fff',
  },
  tabs: {
    display: 'flex', gap: '8px', marginBottom: '1.5rem',
  },
  tab: {
    padding: '8px 18px', borderRadius: '20px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem', cursor: 'pointer',
    fontWeight: '500',
  },
  tabActive: {
    background: 'var(--accent-soft)',
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
  },
  loadingCard: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '4rem', gap: '1rem',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  loadingIcon: { fontSize: '3rem' },
  loadingText: {
    color: 'var(--text-secondary)', fontSize: '0.95rem',
  },
  adviceCard: {
    background: 'linear-gradient(135deg, #1e1e2e, #1a1033)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--accent)',
    marginBottom: '1rem',
  },
  adviceHeader: {
    display: 'flex', alignItems: 'center',
    gap: '8px', marginBottom: '1rem',
  },
  adviceIcon: { fontSize: '1.25rem' },
  adviceTitle: {
    fontSize: '0.875rem', fontWeight: '600',
    color: 'var(--accent)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  adviceText: {
    fontSize: '0.95rem', color: 'var(--text-secondary)',
    lineHeight: '1.7', whiteSpace: 'pre-wrap',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem', marginBottom: '1rem',
  },
  statCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem',
    border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '4px',
  },
  statIcon: { fontSize: '1.25rem' },
  statValue: {
    fontSize: '1.5rem', fontWeight: '700', lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.7rem', color: 'var(--text-muted)',
    textAlign: 'center',
  },
  refreshBtn: {
    padding: '8px 20px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem', cursor: 'pointer',
  },
  moodCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--border)',
  },
  cardTitle: {
    fontSize: '1rem', fontWeight: '600',
    color: 'var(--text-primary)', marginBottom: '1.5rem',
  },
  sliderGroup: { marginBottom: '1.5rem' },
  sliderLabel: {
    display: 'flex', justifyContent: 'space-between',
    marginBottom: '8px', fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  sliderValue: {
    fontWeight: '600', color: 'var(--accent)',
  },
  slider: {
    width: '100%', accentColor: '#6366f1',
  },
  sliderHints: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.75rem', color: 'var(--text-muted)',
    marginTop: '4px',
  },
  btn: {
    width: '100%', padding: '0.85rem',
    borderRadius: 'var(--radius)', border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: '#fff', fontSize: '0.95rem',
    fontWeight: '600', cursor: 'pointer',
    marginTop: '0.5rem',
  },
  btnDisabled: {
    width: '100%', padding: '0.85rem',
    borderRadius: 'var(--radius)', border: 'none',
    background: 'var(--bg-hover)',
    color: 'var(--text-muted)',
    fontSize: '0.95rem', fontWeight: '600',
    cursor: 'not-allowed', marginTop: '0.5rem',
  },
  moodResult: {
    marginTop: '1.5rem',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius)',
    padding: '1.25rem',
    border: '1px solid var(--border)',
  },
  moodMessage: {
    fontSize: '0.95rem', color: 'var(--text-primary)',
    marginBottom: '1rem', lineHeight: '1.6',
  },
  moodStats: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
    gap: '1rem', marginBottom: '1rem',
  },
  moodStat: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '4px',
  },
  moodStatVal: {
    fontSize: '1.1rem', fontWeight: '700',
    color: 'var(--accent)',
  },
  moodStatKey: {
    fontSize: '0.7rem', color: 'var(--text-muted)',
    textAlign: 'center',
  },
  moodTip: {
    fontSize: '0.875rem', color: 'var(--text-secondary)',
    padding: '0.75rem',
    background: 'var(--accent-soft)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--accent)',
  },
  planCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--border)',
  },
  formGroup: {
    display: 'flex', flexDirection: 'column',
    gap: '6px', marginBottom: '1rem',
  },
  label: {
    fontSize: '0.8rem', fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '0.65rem 0.875rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem', outline: 'none',
  },
  planResult: {
    marginTop: '1.5rem',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    border: '1px solid var(--border)',
  },
  planTitle: {
    fontSize: '1.1rem', fontWeight: '700',
    color: 'var(--accent)', marginBottom: '0.5rem',
  },
  planOverview: {
    fontSize: '0.875rem', color: 'var(--text-secondary)',
    marginBottom: '1rem', lineHeight: '1.6',
  },
  weekCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius)',
    padding: '1rem',
    marginBottom: '0.75rem',
    border: '1px solid var(--border)',
  },
  weekHeader: {
    display: 'flex', alignItems: 'center',
    gap: '10px', marginBottom: '0.5rem',
  },
  weekNum: {
    fontSize: '0.75rem', fontWeight: '700',
    color: 'var(--accent)',
    background: 'var(--accent-soft)',
    padding: '2px 8px', borderRadius: '10px',
  },
  weekFocus: {
    fontSize: '0.875rem', fontWeight: '600',
    color: 'var(--text-primary)',
  },
  weekDetails: {
    display: 'flex', gap: '1rem',
    marginBottom: '0.75rem',
  },
  weekStat: {
    fontSize: '0.78rem', color: 'var(--text-muted)',
  },
  task: {
    display: 'flex', gap: '8px',
    padding: '3px 0',
    fontSize: '0.825rem', color: 'var(--text-secondary)',
  },
  taskDot: { color: 'var(--accent)', flexShrink: 0 },
  taskText: { lineHeight: '1.4' },
  milestones: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'var(--amber-soft)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--amber)',
  },
  milestonesTitle: {
    fontSize: '0.875rem', fontWeight: '600',
    color: 'var(--amber)', marginBottom: '0.5rem',
  },
  milestone: {
    display: 'flex', gap: '8px',
    fontSize: '0.825rem', color: 'var(--text-secondary)',
    padding: '3px 0',
  },
  milestoneDot: { color: 'var(--amber)' },
  tips: {
    marginTop: '0.75rem',
    padding: '1rem',
    background: 'var(--green-soft)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--green)',
  },
  tipsTitle: {
    fontSize: '0.875rem', fontWeight: '600',
    color: 'var(--green)', marginBottom: '0.5rem',
  },
  tip: {
    fontSize: '0.825rem', color: 'var(--text-secondary)',
    padding: '3px 0', lineHeight: '1.5',
  },
};