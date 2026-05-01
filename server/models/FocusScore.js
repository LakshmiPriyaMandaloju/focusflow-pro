const mongoose = require('mongoose');

const focusScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  totalMinutes: {
    type: Number,
    default: 0
  },
  sessionsCompleted: {
    type: Number,
    default: 0
  },
  distractionAttempts: {
    type: Number,
    default: 0
  },
  peakHour: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('FocusScore', focusScoreSchema);