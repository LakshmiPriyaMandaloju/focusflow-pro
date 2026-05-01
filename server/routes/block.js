const express = require('express');
const router = express.Router();
const {
  addSite,
  getList,
  removeSite,
  updateProfile,
  resetBreakAttempts
} = require('../controllers/blockController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addSite);
router.get('/list', protect, getList);
router.delete('/remove/:id', protect, removeSite);
router.put('/profile', protect, updateProfile);
router.post('/reset', protect, resetBreakAttempts);

module.exports = router;