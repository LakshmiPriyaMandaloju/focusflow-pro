const StudySession = require('../models/StudySession');
const User = require('../models/User');
const FocusScore = require('../models/FocusScore');
const Goal = require('../models/Goal');
const { calculateFocusScore } = require('../utils/focusScore');

exports.startSession = async (req, res) => {
  try {
    const { plannedDuration, mode, goalId } = req.body;

    const activeSession = await StudySession.findOne({
      userId: req.user.id,
      status: 'active'
    });

    if (activeSession) {
      return res.status(400).json({ message: 'Session already active' });
    }

    const session = await StudySession.create({
      userId: req.user.id,
      startTime: new Date(),
      plannedDuration: plannedDuration || 25,
      mode: mode || 'pomodoro',
      goalId: goalId || null,
      status: 'active'
    });

    const io = req.app.get('io');
    if (req.body.roomId) {
      io.to(req.body.roomId).emit('peer-session-started', {
        userId: req.user.id,
        name: req.user.name,
        roomId: req.body.roomId
      });
    }

    res.status(201).json(session);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { status, distractionAttempts, notes, roomId } = req.body;

    const session = await StudySession.findOne({
      userId: req.user.id,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ message: 'No active session found' });
    }

    const endTime = new Date();
    const actualDuration = Math.round(
      (endTime - session.startTime) / 60000
    );

    const focusScore = calculateFocusScore(
      actualDuration,
      session.plannedDuration,
      distractionAttempts || 0
    );

    const xpEarned = status === 'completed'
      ? Math.round(focusScore * 0.5 + actualDuration * 0.3)
      : Math.round(actualDuration * 0.1);

    session.endTime = endTime;
    session.actualDuration = actualDuration;
    session.status = status || 'completed';
    session.focusScore = focusScore;
    session.distractionAttempts = distractionAttempts || 0;
    session.xpEarned = xpEarned;
    session.notes = notes || '';
    await session.save();

    const user = await User.findById(req.user.id);
    user.addXP(xpEarned);

    if (status === 'completed') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastStudy = user.streak.lastStudyDate
        ? new Date(user.streak.lastStudyDate)
        : null;

      if (!lastStudy || lastStudy < today) {
        user.streak.current += 1;
        user.streak.lastStudyDate = new Date();
        if (user.streak.current > user.streak.longest) {
          user.streak.longest = user.streak.current;
        }
      }

      if (distractionAttempts >= 3) {
        user.blockingProfile = 'strict';
      }

      const badges = [];
      if (user.streak.current === 7) {
        badges.push({ name: '7 Day Streak', icon: '🔥', earnedAt: new Date() });
      }
      if (user.streak.current === 30) {
        badges.push({ name: '30 Day Master', icon: '👑', earnedAt: new Date() });
      }
      if (user.xp >= 1000 && !user.badges.find(b => b.name === 'Focus Pro')) {
        badges.push({ name: 'Focus Pro', icon: '⚡', earnedAt: new Date() });
      }
      if (badges.length > 0) {
        user.badges.push(...badges);
      }

      if (session.goalId) {
        await Goal.findByIdAndUpdate(session.goalId, {
          $inc: { completedMinutes: actualDuration }
        });
      }
    } else {
      user.breakAttempts += 1;
      if (user.breakAttempts >= 3) {
        user.blockingProfile = 'strict';
      }
    }

    await user.save();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await FocusScore.findOneAndUpdate(
      { userId: req.user.id, date: today },
      {
        $inc: {
          totalMinutes: actualDuration,
          sessionsCompleted: status === 'completed' ? 1 : 0,
          distractionAttempts: distractionAttempts || 0
        },
        $max: { score: focusScore }
      },
      { upsert: true, new: true }
    );

    const io = req.app.get('io');
    if (roomId) {
      io.to(roomId).emit('peer-session-ended', {
        userId: req.user.id,
        name: user.name,
        focusScore,
        roomId
      });
    }

    res.json({
      session,
      xpEarned,
      focusScore,
      newLevel: user.level,
      newXP: user.xp,
      streak: user.streak.current,
      newBadges: user.badges.slice(-3)
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getActiveSession = async (req, res) => {
  try {
    const session = await StudySession.findOne({
      userId: req.user.id,
      status: 'active'
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('goalId', 'title color');
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.trackDistraction = async (req, res) => {
  try {
    const { siteURL, roomId } = req.body;

    const session = await StudySession.findOneAndUpdate(
      { userId: req.user.id, status: 'active' },
      { $inc: { distractionAttempts: 1 } },
      { new: true }
    );

    const user = await User.findById(req.user.id);
    const io = req.app.get('io');

    if (roomId) {
      io.to(roomId).emit('peer-distraction', {
        userId: req.user.id,
        name: user.name,
        siteURL,
        roomId
      });
    }

    res.json({
      message: 'Distraction tracked',
      attempts: session ? session.distractionAttempts : 0,
      blockingProfile: user.blockingProfile
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};