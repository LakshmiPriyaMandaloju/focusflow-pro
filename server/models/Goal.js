const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  targetMinutes: {
    type: Number,
    required: true
  },
  completedMinutes: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['study', 'coding', 'reading', 'revision', 'other'],
    default: 'study'
  },
  subtasks: [{
    title: String,
    completed: { type: Boolean, default: false }
  }],
  color: {
    type: String,
    default: '#6366f1'
  }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);