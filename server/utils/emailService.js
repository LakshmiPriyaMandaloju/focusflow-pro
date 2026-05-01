const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendWeeklyReport = async (email, name, stats) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">FocusFlow Weekly Report</h1>
      <p>Hi ${name}! Here's your weekly summary:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <h2 style="margin-top:0">📊 This Week</h2>
        <p>Total Study Time: <strong>${stats.totalMinutes} minutes</strong></p>
        <p>Sessions Completed: <strong>${stats.completedSessions}</strong></p>
        <p>Current Streak: <strong>${stats.streak} days 🔥</strong></p>
        <p>Focus Score: <strong>${stats.avgScore}/100</strong></p>
        <p>Best Day: <strong>${stats.bestDay}</strong></p>
      </div>
      <p style="color:#6366f1; font-weight:bold">${stats.message}</p>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your FocusFlow Weekly Report — ${new Date().toLocaleDateString()}`,
    html
  });
};

const sendReminder = async (email, name, message) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `FocusFlow Reminder — ${message}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Hey ${name}!</h2>
        <p>${message}</p>
        <a href="${process.env.CLIENT_URL}" 
           style="background:#6366f1; color:white; padding:12px 24px; 
                  border-radius:8px; text-decoration:none; display:inline-block; margin-top:16px;">
          Start Studying Now
        </a>
      </div>
    `
  });
};

module.exports = { sendWeeklyReport, sendReminder };