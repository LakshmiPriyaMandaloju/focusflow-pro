const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: String,
    icon: String,
    earnedAt: Date
  }],
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastStudyDate: { type: Date }
  },
  preferences: {
    focusDuration: { type: Number, default: 25 },
    breakDuration: { type: Number, default: 5 },
    dailyGoalMinutes: { type: Number, default: 120 },
    soundEnabled: { type: Boolean, default: true },
    emailReminders: { type: Boolean, default: true },
    theme: { type: String, default: 'dark' }
  },
  blockingProfile: {
    type: String,
    enum: ['normal', 'strict', 'hardcore'],
    default: 'normal'
  },
  breakAttempts: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

userSchema.methods.addXP = function(points) {
  this.xp += points;
  this.level = Math.floor(this.xp / 500) + 1;
};

module.exports = mongoose.model('User', userSchema);