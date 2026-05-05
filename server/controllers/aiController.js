const Anthropic = require('@anthropic-ai/sdk');
const StudySession = require('../models/StudySession');
const User = require('../models/User');
const Goal = require('../models/Goal');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

exports.getFocusAdvice = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const recentSessions = await StudySession.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    const goals = await Goal.find({
      userId: req.user.id,
      status: 'active'
    }).limit(5);

    const completedSessions = recentSessions.filter(
      s => s.status === 'completed'
    );
    const brokenSessions = recentSessions.filter(
      s => s.status === 'broken'
    );
    const avgFocusScore = completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((a, s) => a + s.focusScore, 0) /
          completedSessions.length
        )
      : 0;
    const totalDistractions = recentSessions.reduce(
      (a, s) => a + (s.distractionAttempts || 0), 0
    );

    const userContext = `
      Student Name: ${user.name}
      Current Level: ${user.level}
      Total XP: ${user.xp}
      Current Streak: ${user.streak.current} days
      Recent Sessions: ${recentSessions.length} total
      Completed: ${completedSessions.length}
      Broken Early: ${brokenSessions.length}
      Average Focus Score: ${avgFocusScore}/100
      Total Distractions: ${totalDistractions}
      Active Goals: ${goals.map(g => `${g.title} (${Math.round((g.completedMinutes/g.targetMinutes)*100)}% done)`).join(', ') || 'None'}
      Blocking Profile: ${user.blockingProfile}
    `;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are FocusFlow AI — a smart, friendly study assistant. 
          Analyze this student's data and give personalized, actionable advice.
          Be encouraging, specific, and concise. Use emojis naturally.
          Give exactly 3 insights and 2 action items. Keep it under 200 words.
          
          Student Data:
          ${userContext}
          
          Provide:
          1. Analysis of their current performance
          2. Specific improvement suggestions
          3. Motivational message based on their progress`
        }
      ]
    });

    res.json({
      advice: message.content[0].text,
      stats: {
        avgFocusScore,
        completedSessions: completedSessions.length,
        brokenSessions: brokenSessions.length,
        totalDistractions,
        streak: user.streak.current
      }
    });

  } catch (error) {
    console.error('AI error:', error.message);
    res.status(500).json({
      message: 'AI service error',
      error: error.message
    });
  }
};

exports.getStudyPlan = async (req, res) => {
  try {
    const { subject, targetDate, dailyHours } = req.body;
    const user = await User.findById(req.user.id).select('-password');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are FocusFlow AI — a smart study planner.
          Create a detailed, realistic study plan.
          Format as JSON only, no extra text.
          
          Student: ${user.name}
          Subject/Goal: ${subject}
          Target Date: ${targetDate}
          Daily Available Hours: ${dailyHours}
          Current Streak: ${user.streak.current} days
          
          Return JSON:
          {
            "title": "plan title",
            "overview": "brief overview",
            "weeklyPlan": [
              {
                "week": 1,
                "focus": "topic",
                "dailyTasks": ["task1", "task2"],
                "sessionDuration": 25,
                "sessionsPerDay": 3
              }
            ],
            "tips": ["tip1", "tip2", "tip3"],
            "milestones": ["milestone1", "milestone2"]
          }`
        }
      ]
    });

    let plan;
    try {
      const text = message.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      plan = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      plan = { overview: message.content[0].text };
    }

    res.json(plan);

  } catch (error) {
    console.error('AI Plan error:', error.message);
    res.status(500).json({
      message: 'AI service error',
      error: error.message
    });
  }
};

exports.analyzeMood = async (req, res) => {
  try {
    const { mood, energy } = req.body;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are FocusFlow AI. A student reports:
          Mood: ${mood}/10
          Energy: ${energy}/10
          
          Based on this, recommend:
          1. Ideal session duration (in minutes)
          2. Study mode (pomodoro/long/short)
          3. One motivational tip
          4. Whether to take a break first
          
          Return JSON only:
          {
            "sessionDuration": 25,
            "mode": "pomodoro",
            "tip": "...",
            "takeBreakFirst": false,
            "message": "personalized message"
          }`
        }
      ]
    });

    let recommendation;
    try {
      const text = message.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      recommendation = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      recommendation = {
        sessionDuration: 25,
        mode: 'pomodoro',
        tip: 'Start small and build momentum!',
        takeBreakFirst: false,
        message: message.content[0].text
      };
    }

    res.json(recommendation);

  } catch (error) {
    res.status(500).json({
      message: 'AI service error',
      error: error.message
    });
  }
};