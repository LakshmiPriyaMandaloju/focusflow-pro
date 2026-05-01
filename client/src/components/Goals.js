import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['study', 'coding', 'reading', 'revision', 'other'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

export default function Goals() {
  const [goals, setGoals]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({
    title: '',
    description: '',
    targetMinutes: 60,
    category: 'study',
    color: '#6366f1',
    deadline: '',
    subtasks: []
  });
  const [subtaskInput, setSubtaskInput] = useState('');

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try {
      const { data } = await api.getGoals();
      setGoals(data);
    } catch {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    try {
      await api.createGoal(form);
      toast.success('Goal created!');
      setShowForm(false);
      setForm({
        title: '', description: '',
        targetMinutes: 60, category: 'study',
        color: '#6366f1', deadline: '', subtasks: []
      });
      fetchGoals();
    } catch {
      toast.error('Failed to create goal');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteGoal(id);
      toast.success('Goal deleted');
      fetchGoals();
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.updateGoal(id, { status: 'completed' });
      toast.success('Goal completed!');
      fetchGoals();
    } catch {
      toast.error('Failed to update goal');
    }
  };

  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    setForm(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { title: subtaskInput, completed: false }]
    }));
    setSubtaskInput('');
  };

  const removeSubtask = (i) => {
    setForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, idx) => idx !== i)
    }));
  };

  if (loading) return (
    <div style={styles.loading}>
      <span style={{ fontSize: '3rem' }}>🎯</span>
      <p>Loading goals...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Study Goals</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addBtn}
        >
          {showForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Create New Goal</h3>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Complete DSA Course"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Target Minutes</label>
              <input
                type="number"
                value={form.targetMinutes}
                onChange={e => setForm({ ...form, targetMinutes: parseInt(e.target.value) })}
                style={styles.input}
                min="1"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={styles.select}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What do you want to achieve?"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Color</label>
            <div style={styles.colorRow}>
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  style={{
                    ...styles.colorBtn,
                    background: c,
                    border: form.color === c
                      ? `3px solid white`
                      : '3px solid transparent'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Subtasks</label>
            <div style={styles.subtaskRow}>
              <input
                value={subtaskInput}
                onChange={e => setSubtaskInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubtask()}
                placeholder="Add subtask..."
                style={{ ...styles.input, flex: 1 }}
              />
              <button onClick={addSubtask} style={styles.addSubBtn}>
                Add
              </button>
            </div>
            {form.subtasks.map((s, i) => (
              <div key={i} style={styles.subtaskItem}>
                <span style={styles.subtaskText}>{s.title}</span>
                <button
                  onClick={() => removeSubtask(i)}
                  style={styles.removeSubBtn}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button onClick={handleSubmit} style={styles.submitBtn}>
            Create Goal
          </button>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 && !showForm ? (
        <div style={styles.empty}>
          <span style={{ fontSize: '4rem' }}>🎯</span>
          <h3 style={styles.emptyTitle}>No goals yet</h3>
          <p style={styles.emptySub}>
            Create your first study goal to track progress
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={styles.addBtn}
          >
            + Create Goal
          </button>
        </div>
      ) : (
        <div style={styles.goalsGrid}>
          {goals.map(goal => (
            <div
              key={goal._id}
              style={{
                ...styles.goalCard,
                borderTop: `3px solid ${goal.color}`
              }}
            >
              <div style={styles.goalHeader}>
                <div>
                  <span style={styles.goalCategory}>
                    {goal.category}
                  </span>
                  <h3 style={styles.goalTitle}>{goal.title}</h3>
                  {goal.description && (
                    <p style={styles.goalDesc}>{goal.description}</p>
                  )}
                </div>
                <div style={styles.goalActions}>
                  <button
                    onClick={() => handleComplete(goal._id)}
                    style={styles.completeBtn}
                    title="Mark complete"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleDelete(goal._id)}
                    style={styles.deleteBtn}
                    title="Delete goal"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div style={styles.progressWrap}>
                <div style={styles.progressInfo}>
                  <span style={styles.progressText}>
                    {goal.completedMinutes}m / {goal.targetMinutes}m
                  </span>
                  <span style={{
                    ...styles.progressPct,
                    color: goal.color
                  }}>
                    {goal.progressPercent}%
                  </span>
                </div>
                <div style={styles.progressTrack}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${goal.progressPercent}%`,
                    background: goal.color
                  }} />
                </div>
              </div>

              {goal.deadline && (
                <div style={styles.deadline}>
                  📅 Due: {new Date(goal.deadline).toLocaleDateString()}
                </div>
              )}

              {goal.subtasks?.length > 0 && (
                <div style={styles.subtasks}>
                  {goal.subtasks.map((s, i) => (
                    <div key={i} style={styles.subtaskRow2}>
                      <span style={{
                        ...styles.subtaskDot,
                        background: s.completed ? goal.color : 'var(--border)'
                      }} />
                      <span style={{
                        ...styles.subtaskTitle,
                        textDecoration: s.completed ? 'line-through' : 'none',
                        color: s.completed
                          ? 'var(--text-muted)'
                          : 'var(--text-secondary)'
                      }}>
                        {s.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '1rem',
    color: 'var(--text-secondary)',
  },
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
  addBtn: {
    padding: '8px 18px',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  formCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--border)',
    marginBottom: '1.5rem',
  },
  formTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '1.25rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginBottom: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '0.65rem 0.875rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  },
  select: {
    padding: '0.65rem 0.875rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    cursor: 'pointer',
  },
  colorRow: {
    display: 'flex',
    gap: '8px',
  },
  colorBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    cursor: 'pointer',
  },
  subtaskRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  addSubBtn: {
    padding: '0.65rem 1rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-hover)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  subtaskItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    background: 'var(--bg-secondary)',
    borderRadius: '6px',
    marginBottom: '4px',
  },
  subtaskText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  removeSubBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--red)',
    cursor: 'pointer',
    fontSize: '1.1rem',
    lineHeight: 1,
  },
  submitBtn: {
    padding: '0.75rem 2rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
    gap: '1rem',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  emptySub: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  goalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  goalCard: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    border: '1px solid var(--border)',
  },
  goalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  goalCategory: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '4px',
  },
  goalTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  goalDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  goalActions: {
    display: 'flex',
    gap: '6px',
  },
  completeBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '1px solid var(--green)',
    background: 'var(--green-soft)',
    color: 'var(--green)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: { marginBottom: '0.75rem' },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  progressText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  progressPct: {
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  progressTrack: {
    height: '6px',
    background: 'var(--border)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  deadline: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    marginBottom: '0.75rem',
  },
  subtasks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderTop: '1px solid var(--border)',
    paddingTop: '0.75rem',
  },
  subtaskRow2: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  subtaskDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  subtaskTitle: {
    fontSize: '0.8rem',
  },
};