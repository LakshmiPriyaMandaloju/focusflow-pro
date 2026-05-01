const Goal = require('../models/Goal');

exports.createGoal = async (req, res) => {
  try {
    const { title, description, targetMinutes, deadline, category, color, subtasks } = req.body;

    const goal = await Goal.create({
      userId: req.user.id,
      title,
      description,
      targetMinutes,
      deadline,
      category: category || 'study',
      color: color || '#6366f1',
      subtasks: subtasks || []
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({
      userId: req.user.id,
      status: { $ne: 'completed' }
    }).sort({ createdAt: -1 });

    const goalsWithProgress = goals.map(goal => ({
      ...goal.toObject(),
      progressPercent: Math.min(
        Math.round((goal.completedMinutes / goal.targetMinutes) * 100),
        100
      )
    }));

    res.json(goalsWithProgress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.toggleSubtask = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const subtask = goal.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    subtask.completed = !subtask.completed;

    const allDone = goal.subtasks.every(s => s.completed);
    if (allDone && goal.subtasks.length > 0) {
      goal.status = 'completed';
    }

    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};