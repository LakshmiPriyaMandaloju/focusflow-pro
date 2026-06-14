const Groq = require('groq-sdk');
const StudySession = require('../models/StudySession');
const User = require('../models/User');
const Goal = require('../models/Goal');

const getGroqClient = () => new Groq({
  apiKey: process.env.GROQ_API_KEY
});

exports.getFocusAdvice = async (req, res) => {
  try {
    console.log('AI advice requested by:', req.user.id);
    console.log('Groq Key exists:', !!process.env.GROQ_API_KEY);

    const user = await User.findById(req.user.id).select('-password');
    const sessions = await StudySession.find({ userId: req.user.id })
      .sort({ createdAt: -1 }).limit(10);
    const goals = await Goal.find({
      userId: req.user.id, status: 'active'
    }).limit(5);

    const completed = sessions.filter(s => s.status === 'completed');
    const broken = sessions.filter(s => s.status === 'broken');
    const avgScore = completed.length > 0
      ? Math.round(
          completed.reduce((a, s) => a + s.focusScore, 0) /
          completed.length
        )
      : 0;
    const distractions = sessions.reduce(
      (a, s) => a + (s.distractionAttempts || 0), 0
    );

    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are FocusFlow AI assistant. Give brief, friendly study advice.
        
        Student: ${user.name}
        Streak: ${user.streak?.current || 0} days
        Completed sessions: ${completed.length}
        Broken sessions: ${broken.length}
        Avg focus score: ${avgScore}/100
        Distractions: ${distractions}
        Active goals: ${goals.map(g => g.title).join(', ') || 'None'}
        
        Give 3 short insights and 2 action items. Use emojis. Max 150 words.`
      }]
    });

    console.log('Groq response received!');

    res.json({
      advice: completion.choices[0].message.content,
      stats: {
        avgFocusScore: avgScore,
        completedSessions: completed.length,
        brokenSessions: broken.length,
        totalDistractions: distractions,
        streak: user.streak?.current || 0
      }
    });

  } catch (error) {
    console.error('AI Error:', error.message);
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

    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [{
        role: 'system',
        content: 'You are a study planner. Always respond with valid JSON only. No extra text.'
      }, {
        role: 'user',
        content: `Create a study plan for:
        Student: ${user.name}
        Subject: ${subject}
        Target Date: ${targetDate}
        Daily Hours: ${dailyHours}
        
        Return ONLY this JSON:
        {
          "title": "string",
          "overview": "string",
          "weeklyPlan": [
            {
              "week": 1,
              "focus": "string",
              "dailyTasks": ["task1", "task2"],
              "sessionDuration": 25,
              "sessionsPerDay": 3
            }
          ],
          "tips": ["tip1", "tip2", "tip3"],
          "milestones": ["m1", "m2", "m3"]
        }`
      }]
    });

    let plan;
    try {
      const text = completion.choices[0].message.content.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      plan = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      plan = {
        title: subject,
        overview: completion.choices[0].message.content,
        weeklyPlan: [],
        tips: [],
        milestones: []
      };
    }

    res.json(plan);

  } catch (error) {
    console.error('Study Plan Error:', error.message);
    res.status(500).json({
      message: 'AI service error',
      error: error.message
    });
  }
};

exports.analyzeMood = async (req, res) => {
  try {
    const { mood, energy } = req.body;

    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [{
        role: 'system',
        content: 'You are a study coach. Always respond with valid JSON only. No extra text.'
      }, {
        role: 'user',
        content: `Student mood: ${mood}/10, energy: ${energy}/10.
        
        Return ONLY this JSON:
        {
          "sessionDuration": 25,
          "mode": "pomodoro",
          "tip": "one specific tip here",
          "takeBreakFirst": false,
          "message": "personalized encouraging message here"
        }`
      }]
    });

    let result;
    try {
      const text = completion.choices[0].message.content.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      result = {
        sessionDuration: mood < 5 ? 15 : 25,
        mode: mood < 5 ? 'short' : 'pomodoro',
        tip: 'Start small and build momentum!',
        takeBreakFirst: energy < 4,
        message: completion.choices[0].message.content
      };
    }

    res.json(result);

  } catch (error) {
    console.error('Mood Error:', error.message);
    res.status(500).json({
      message: 'AI service error',
      error: error.message
    });
  }
};