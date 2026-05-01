const express = require('express');
const router = express.Router();
const {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  toggleSubtask
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createGoal);
router.get('/', protect, getGoals);
router.put('/:id', protect, updateGoal);
router.delete('/:id', protect, deleteGoal);
router.patch('/:id/subtask/:subtaskId', protect, toggleSubtask);

module.exports = router;