const express = require('express');
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getRoom,
  getLeaderboard
} = require('../controllers/socialController');
const { protect } = require('../middleware/authMiddleware');

router.post('/room/create', protect, createRoom);
router.post('/room/join/:roomId', protect, joinRoom);
router.get('/room/:roomId', protect, getRoom);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;