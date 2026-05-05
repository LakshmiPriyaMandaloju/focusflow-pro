const express = require('express');
const router = express.Router();
const {
  getFocusAdvice,
  getStudyPlan,
  analyzeMood
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/advice', protect, getFocusAdvice);
router.post('/plan', protect, getStudyPlan);
router.post('/mood', protect, analyzeMood);

module.exports = router;