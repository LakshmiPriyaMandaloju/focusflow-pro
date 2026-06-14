import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import toast from 'react-hot-toast';

export default function AIAssistant() {
  const [activeTab, setActiveTab]     = useState('insights');
  const [advice, setAdvice]           = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError]     = useState('');
  const [mood, setMood]               = useState(7);
  const [energy, setEnergy]           = useState(7);
  const [moodResult, setMoodResult]   = useState(null);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodError, setMoodError]     = useState('');
  const [planForm, setPlanForm]       = useState({
    subject: '', targetDate: '', dailyHours: 2
  });
  const [studyPlan, setStudyPlan]     = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError]     = useState('');

  useEffect(() => { loadInsights(); }, []);

  const loadInsights = async () => {
    setInsightsLoading(true);
    setInsightsError('');
    setAdvice(null);
    try {
      const { data } = await api.getAIAdvice();
      setAdvice(data);
    } catch (err) {
      setInsightsError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to load insights'
      );
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleMood = async () => {
    setMoodLoading(true);
    setMoodError('');
    setMoodResult(null);
    try {
      const { data } = await api.analyzeMood({ mood, energy });
      setMoodResult(data);
    } catch (err) {
      setMoodError(
        err.response?.data?.error ||
        'Failed to analyze mood'
      );
    } finally {
      setMoodLoading(false);
    }
  };

  const handlePlan = async () => {
    if (!planForm.subject.trim() || !planForm.targetDate) {
      return toast.error('Please fill subject and date');
    }
    setPlanLoading(true);
    setPlanError('');
    setStudyPlan(null);
    try {
      const { data } = await api.getStudyPlan(planForm);
      setStudyPlan(data);
    } catch (err) {
      setPlanError(
        err.response?.data?.error ||
        'Failed to generate plan'
      );
    } finally {
      setPlanLoading(false);
    }
  };

  const TABS = [
    { id: 'insights', label: '💡 Insights'    },
    { id: 'mood',     label: '😊 Mood check'  },
    { id: 'plan',     label: '📅 Study plan'  },
  ];

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>AI Focus Assistant</h2>
          <p style={s.subtitle}>Powered by Groq · LLaMA 3.3</p>
        </div>
        <div style={s.badge}>🧠 AI</div>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              ...s.tab,
              ...(activeTab === t.id ? s.tabActive : {})
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div style={s.card}>
          <p style={s.cardTitle}>Personalized insights</p>

          {insightsLoading && (
            <div style={s.loading}>
              <span style={s.loadingIcon}>🧠</span>
              <p>Analyzing your study patterns...</p>
            </div>
          )}

          {insightsError && (
            <div style={s.errorBox}>{insightsError}</div>
          )}

          {advice && !insightsLoading && (
            <>
              <div style={s.adviceBox}>
                <p style={s.adviceText}>{advice.advice}</p>
              </div>

              <div style={s.statGrid}>
                {[
                  { label: 'Focus score',  value: advice.stats?.avgFocusScore ?? 0   },
                  { label: 'Sessions done',value: advice.stats?.completedSessions ?? 0},
                  { label: 'Day streak',   value: `${advice.stats?.streak ?? 0}d`    },
                  { label: 'Distractions', value: advice.stats?.totalDistractions ?? 0},
                ].map((st, i) => (
                  <div key={i} style={s.statCard}>
                    <span style={s.statVal}>{st.value}</span>
                    <span style={s.statLbl}>{st.label}</span>
                  </div>
                ))}
              </div>

              <button onClick={loadInsights} style={s.btn}>
                🔄 Refresh insights
              </button>
            </>
          )}
        </div>
      )}

      {/* Mood Tab */}
      {activeTab === 'mood' && (
        <div style={s.card}>
          <p style={s.cardTitle}>How are you feeling?</p>

          <div style={s.sliderGroup}>
            <div style={s.sliderRow}>
              <span>Mood</span>
              <span style={s.sliderVal}>{mood} / 10</span>
            </div>
            <input
              type="range" min="1" max="10" step="1"
              value={mood}
              onChange={e => setMood(parseInt(e.target.value))}
              style={s.slider}
            />
            <div style={s.hintRow}>
              <span>Terrible</span><span>Amazing</span>
            </div>
          </div>

          <div style={s.sliderGroup}>
            <div style={s.sliderRow}>
              <span>Energy</span>
              <span style={s.sliderVal}>{energy} / 10</span>
            </div>
            <input
              type="range" min="1" max="10" step="1"
              value={energy}
              onChange={e => setEnergy(parseInt(e.target.value))}
              style={s.slider}
            />
            <div style={s.hintRow}>
              <span>Exhausted</span><span>Energized</span>
            </div>
          </div>

          <button
            onClick={handleMood}
            disabled={moodLoading}
            style={moodLoading ? s.btnDisabled : s.btnPrimary}
          >
            {moodLoading ? 'Analyzing...' : 'Get AI recommendation'}
          </button>

          {moodError && (
            <div style={{...s.errorBox, marginTop: '1rem'}}>
              {moodError}
            </div>
          )}

          {moodResult && (
            <div style={s.resultBox}>
              <p style={s.resultMsg}>{moodResult.message}</p>
              <div style={s.resultGrid}>
                {[
                  { label: 'Session duration', value: `${moodResult.sessionDuration}m` },
                  { label: 'Recommended mode', value: moodResult.mode                 },
                  { label: 'Break first?',     value: moodResult.takeBreakFirst ? 'Yes' : 'No' },
                ].map((r, i) => (
                  <div key={i} style={s.resultItem}>
                    <span style={s.resultVal}>{r.value}</span>
                    <span style={s.resultKey}>{r.label}</span>
                  </div>
                ))}
              </div>
              <div style={s.tipBox}>💡 {moodResult.tip}</div>
            </div>
          )}
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <>
          <div style={s.card}>
            <p style={s.cardTitle}>Generate AI study plan</p>

            <div style={s.formGroup}>
              <label style={s.label}>Subject / goal</label>
              <input
                value={planForm.subject}
                onChange={e => setPlanForm({...planForm, subject: e.target.value})}
                placeholder="e.g. Data Structures, GATE prep, React JS"
                style={s.input}
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Target date</label>
              <input
                type="date"
                value={planForm.targetDate}
                onChange={e => setPlanForm({...planForm, targetDate: e.target.value})}
                style={s.input}
              />
            </div>

            <div style={s.sliderGroup}>
              <div style={s.sliderRow}>
                <span style={{fontSize:'13px', color:'var(--text-secondary)'}}>
                  Daily hours available
                </span>
                <span style={s.sliderVal}>{planForm.dailyHours}h</span>
              </div>
              <input
                type="range" min="1" max="12" step="1"
                value={planForm.dailyHours}
                onChange={e => setPlanForm({
                  ...planForm, dailyHours: parseInt(e.target.value)
                })}
                style={s.slider}
              />
            </div>

            <button
              onClick={handlePlan}
              disabled={planLoading}
              style={planLoading ? s.btnDisabled : s.btnPrimary}
            >
              {planLoading ? '🧠 AI is planning...' : '🚀 Generate study plan'}
            </button>

            {planError && (
              <div style={{...s.errorBox, marginTop:'1rem'}}>
                {planError}
              </div>
            )}
          </div>

          {planLoading && (
            <div style={s.loading}>
              <span style={s.loadingIcon}>📅</span>
              <p>AI is building your plan...</p>
            </div>
          )}

          {studyPlan && (
            <div style={s.card}>
              <p style={{
                fontSize:'16px', fontWeight:'600',
                color:'var(--text-primary)', marginBottom:'0.5rem'
              }}>
                {studyPlan.title || planForm.subject}
              </p>
              <p style={{
                fontSize:'13px', color:'var(--text-secondary)',
                lineHeight:'1.6', marginBottom:'1.25rem'
              }}>
                {studyPlan.overview}
              </p>

              {studyPlan.weeklyPlan?.length > 0 && (
                <>
                  <p style={s.cardTitle}>Weekly breakdown</p>
                  {studyPlan.weeklyPlan.map((w, i) => (
                    <div key={i} style={s.weekCard}>
                      <div style={s.weekHead}>
                        <span style={s.weekNum}>Week {w.week}</span>
                        <span style={s.weekFocus}>{w.focus}</span>
                      </div>
                      <p style={{
                        fontSize:'11px', color:'var(--text-muted)',
                        marginBottom:'0.5rem'
                      }}>
                        {w.sessionDuration}m sessions · {w.sessionsPerDay}x daily
                      </p>
                      {w.dailyTasks?.map((t, j) => (
                        <div key={j} style={s.task}>
                          <span style={{color:'#6366f1'}}>▸</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}

              {studyPlan.milestones?.length > 0 && (
                <>
                  <p style={{...s.cardTitle, marginTop:'1rem'}}>Milestones</p>
                  {studyPlan.milestones.map((m, i) => (
                    <div key={i} style={{...s.task, padding:'4px 0'}}>
                      <span style={{color:'#10b981'}}>✓</span>
                      <span style={{fontSize:'13px', color:'var(--text-secondary)'}}>{m}</span>
                    </div>
                  ))}
                </>
              )}

              {studyPlan.tips?.length > 0 && (
                <>
                  <p style={{...s.cardTitle, marginTop:'1rem'}}>Tips</p>
                  {studyPlan.tips.map((t, i) => (
                    <div key={i} style={{...s.tipBox, marginBottom:'6px'}}>
                      {t}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s = {
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
    fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px',
  },
  badge: {
    padding: '6px 14px',
    background: 'var(--bg-hover)',
    border: '1px solid var(--border)',
    borderRadius: '20px', fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  tabs: {
    display: 'flex', gap: '6px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '1.5rem',
  },
  tab: {
    background: 'none', border: 'none',
    borderBottom: '2px solid transparent',
    padding: '8px 16px', fontSize: '0.875rem',
    color: 'var(--text-secondary)', cursor: 'pointer',
    marginBottom: '-1px', fontFamily: 'inherit',
  },
  tabActive: {
    color: 'var(--text-primary)',
    borderBottomColor: 'var(--accent)',
    fontWeight: '600',
  },
  card: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--border)',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '0.75rem', fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: '1rem',
  },
  loading: {
    textAlign: 'center', padding: '3rem',
    color: 'var(--text-secondary)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.75rem',
  },
  loadingIcon: { fontSize: '2.5rem' },
  errorBox: {
    background: 'var(--red-soft)', color: 'var(--red)',
    border: '1px solid var(--red)',
    borderRadius: 'var(--radius)', padding: '0.75rem 1rem',
    fontSize: '0.875rem',
  },
  adviceBox: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius)',
    padding: '1.25rem',
    borderLeft: '3px solid var(--accent)',
    marginBottom: '1rem',
  },
  adviceText: {
    fontSize: '0.9rem', color: 'var(--text-secondary)',
    lineHeight: '1.7', whiteSpace: 'pre-wrap',
  },
  statGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
    gap: '10px', marginBottom: '1rem',
  },
  statCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)', padding: '1rem',
    textAlign: 'center', display: 'flex',
    flexDirection: 'column', gap: '4px',
  },
  statVal: {
    fontSize: '1.5rem', fontWeight: '700',
    color: 'var(--text-primary)',
  },
  statLbl: {
    fontSize: '0.7rem', color: 'var(--text-muted)',
  },
  btn: {
    padding: '8px 18px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-secondary)', fontSize: '0.875rem',
    cursor: 'pointer',
  },
  btnPrimary: {
    width: '100%', padding: '0.85rem',
    borderRadius: 'var(--radius)', border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: '#fff', fontSize: '0.95rem',
    fontWeight: '600', cursor: 'pointer',
  },
  btnDisabled: {
    width: '100%', padding: '0.85rem',
    borderRadius: 'var(--radius)', border: 'none',
    background: 'var(--bg-hover)', color: 'var(--text-muted)',
    fontSize: '0.95rem', fontWeight: '600', cursor: 'not-allowed',
  },
  sliderGroup: { marginBottom: '1.25rem' },
  sliderRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.875rem', color: 'var(--text-secondary)',
    marginBottom: '6px',
  },
  sliderVal: { fontWeight: '600', color: 'var(--text-primary)' },
  slider: { width: '100%', accentColor: '#6366f1' },
  hintRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.75rem', color: 'var(--text-muted)',
    marginTop: '4px',
  },
  resultBox: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius)', padding: '1.25rem',
    marginTop: '1rem',
  },
  resultMsg: {
    fontSize: '0.9rem', color: 'var(--text-primary)',
    lineHeight: '1.6', marginBottom: '1rem',
  },
  resultGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
    gap: '10px', marginBottom: '1rem',
  },
  resultItem: {
    textAlign: 'center', display: 'flex',
    flexDirection: 'column', gap: '4px',
  },
  resultVal: {
    fontSize: '1.1rem', fontWeight: '600',
    color: 'var(--accent)',
  },
  resultKey: { fontSize: '0.7rem', color: 'var(--text-muted)' },
  tipBox: {
    background: 'var(--green-soft)',
    border: '1px solid var(--green)',
    borderRadius: 'var(--radius)', padding: '0.75rem 1rem',
    fontSize: '0.875rem', color: 'var(--text-secondary)',
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
    fontSize: '0.875rem', outline: 'none', width: '100%',
  },
  weekCard: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius)', padding: '1rem',
    marginBottom: '0.75rem',
  },
  weekHead: {
    display: 'flex', alignItems: 'center',
    gap: '8px', marginBottom: '0.5rem',
  },
  weekNum: {
    fontSize: '0.7rem', fontWeight: '600', color: '#6366f1',
    background: 'var(--accent-soft)', padding: '2px 8px',
    borderRadius: '10px',
  },
  weekFocus: {
    fontSize: '0.875rem', fontWeight: '600',
    color: 'var(--text-primary)',
  },
  task: {
    display: 'flex', gap: '8px', padding: '2px 0',
    fontSize: '0.825rem', color: 'var(--text-secondary)',
  },
};