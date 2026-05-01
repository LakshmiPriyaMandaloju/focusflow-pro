const StudySession = require('../models/StudySession');
const FocusScore = require('../models/FocusScore');
const User = require('../models/User');

exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const sessions = await StudySession.find({ userId: req.user.id });

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const brokenSessions = sessions.filter(s => s.status === 'broken');

    const totalStudyTime = completedSessions.reduce(
      (acc, s) => acc + s.actualDuration, 0
    );

    const avgFocusScore = completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + s.focusScore, 0) /
          completedSessions.length
        )
      : 0;

    const weekData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayMinutes = completedSessions
        .filter(s => s.startTime >= dayStart && s.startTime <= dayEnd)
        .reduce((acc, s) => acc + s.actualDuration, 0);

      weekData.push({
        day: dayNames[new Date(dayStart).getDay()],
        minutes: dayMinutes
      });
    }

    const heatmapData = Array(24).fill(0);
    completedSessions.forEach(s => {
      const hour = new Date(s.startTime).getHours();
      heatmapData[hour] += s.actualDuration;
    });

    const peakHour = heatmapData.indexOf(Math.max(...heatmapData));

    const totalDistractions = sessions.reduce(
      (acc, s) => acc + (s.distractionAttempts || 0), 0
    );

    const longestSession = completedSessions.length > 0
      ? Math.max(...completedSessions.map(s => s.actualDuration))
      : 0;

    const leaderboardData = await User.find()
      .select('name xp level streak badges')
      .sort({ xp: -1 })
      .limit(10);

    const userRank = leaderboardData.findIndex(
      u => u._id.toString() === req.user.id
    ) + 1;

    res.json({
      totalStudyTime,
      completedSessions: completedSessions.length,
      brokenSessions: brokenSessions.length,
      avgFocusScore,
      totalDistractions,
      longestSession,
      weekData,
      heatmapData,
      peakHour,
      streak: user.streak.current,
      longestStreak: user.streak.longest,
      xp: user.xp,
      level: user.level,
      badges: user.badges,
      blockingProfile: user.blockingProfile,
      leaderboard: leaderboardData,
      userRank
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getWeeklyReport = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sessions = await StudySession.find({
      userId: req.user.id,
      createdAt: { $gte: sevenDaysAgo }
    });

    const completed = sessions.filter(s => s.status === 'completed');
    const totalMinutes = completed.reduce((acc, s) => acc + s.actualDuration, 0);
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((acc, s) => acc + s.focusScore, 0) / completed.length)
      : 0;

    const dayTotals = {};
    completed.forEach(s => {
      const day = new Date(s.startTime).toLocaleDateString('en-IN', { weekday: 'long' });
      dayTotals[day] = (dayTotals[day] || 0) + s.actualDuration;
    });

    const bestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
    const worstDay = Object.entries(dayTotals).sort((a, b) => a[1] - b[1])[0];

    let message = '';
    if (totalMinutes >= 600) message = 'Outstanding week! You are on fire!';
    else if (totalMinutes >= 300) message = 'Great effort this week! Keep it up!';
    else if (totalMinutes >= 120) message = 'Good start! Push a little harder next week!';
    else message = 'Every expert was once a beginner. Start small!';

    const user = await User.findById(req.user.id);

    res.json({
      totalMinutes,
      completedSessions: completed.length,
      avgScore,
      bestDay: bestDay ? bestDay[0] : 'N/A',
      worstDay: worstDay ? worstDay[0] : 'N/A',
      streak: user.streak.current,
      message
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getHeatmap = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const scores = await FocusScore.find({
      userId: req.user.id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};