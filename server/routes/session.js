const express = require('express');
const router = express.Router();
const {
  startSession,
  endSession,
  getActiveSession,
  getHistory,
  trackDistraction
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startSession);
router.post('/end', protect, endSession);
router.get('/active', protect, getActiveSession);
router.get('/history', protect, getHistory);
router.post('/distraction', protect, trackDistraction);

module.exports = router;