const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  plannedDuration: {
    type: Number,
    required: true
  },
  actualDuration: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'broken'],
    default: 'active'
  },
  focusScore: {
    type: Number,
    default: 0
  },
  distractionAttempts: {
    type: Number,
    default: 0
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  mode: {
    type: String,
    enum: ['pomodoro', 'long', 'custom', 'deep'],
    default: 'pomodoro'
  },
  roomId: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('StudySession', studySessionSchema);