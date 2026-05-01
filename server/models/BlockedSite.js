const mongoose = require('mongoose');

const blockedSiteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  siteURL: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  profile: {
    type: String,
    enum: ['normal', 'strict', 'hardcore'],
    default: 'normal'
  },
  attemptCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('BlockedSite', blockedSiteSchema);