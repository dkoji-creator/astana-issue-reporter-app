// R8: tell the report author that the status changed.
// Always stored in the notifications table (shown in the app);
// also sent as a push if the phone registered an Expo push token.
const db = require('./db');

const STATUS_LABEL = {
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

async function notifyStatusChange(client, report, newStatus) {
  const message = `Your report #${report.id} is now "${STATUS_LABEL[newStatus]}"`;
  await client.query(
    'INSERT INTO notifications (user_id, report_id, message, new_status) VALUES ($1, $2, $3, $4)',
    [report.user_id, report.id, message, newStatus],
  );
  return message;
}

async function sendPush(userId, reportId, message) {
  try {
    const { rows } = await db.query('SELECT push_token FROM users WHERE id = $1', [userId]);
    const token = rows[0] && rows[0].push_token;
    if (!token) return;
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, title: 'Astana Issue Reporter', body: message, data: { reportId } }),
    });
  } catch (err) {
    // A failed push must not break the status change; the in-app notification is already saved
    console.warn('Push failed:', err.message);
  }
}

module.exports = { notifyStatusChange, sendPush, STATUS_LABEL };
