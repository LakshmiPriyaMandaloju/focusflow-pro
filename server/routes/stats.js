const express = require('express');
const router = express.Router();
const {
  getStats,
  getWeeklyReport,
  getHeatmap
} = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getStats);
router.get('/weekly', protect, getWeeklyReport);
router.get('/heatmap', protect, getHeatmap);

module.exports = router;