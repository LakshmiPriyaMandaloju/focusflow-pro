const calculateFocusScore = (duration, plannedDuration, distractionAttempts) => {
  const completionRate = Math.min(duration / plannedDuration, 1);
  const distractionPenalty = Math.max(0, 1 - distractionAttempts * 0.1);
  const score = Math.round(completionRate * distractionPenalty * 100);
  return Math.max(0, Math.min(100, score));
};

const getScoreLabel = (score) => {
  if (score >= 90) return { label: 'Perfect', color: '#10b981' };
  if (score >= 75) return { label: 'Great', color: '#3b82f6' };
  if (score >= 60) return { label: 'Good', color: '#8b5cf6' };
  if (score >= 40) return { label: 'Fair', color: '#f59e0b' };
  return { label: 'Poor', color: '#ef4444' };
};

module.exports = { calculateFocusScore, getScoreLabel };