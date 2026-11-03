// Public web pages the app stores ask for: the privacy policy and a way to delete the account
// without installing the app. Links: <server>/privacy and <server>/delete-account
const express = require('express');
const config = require('../config');
const { deleteAccount } = require('./auth');

const router = express.Router();
const UPDATED = '3 November 2026';

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function page(title, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Astana Issue Reporter</title>
<style>
  body { font: 16px/1.55 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #111827; background: #F4F6FB; margin: 0; }
  main { max-width: 720px; margin: 0 auto; padding: 24px 16px 48px; }
  h1 { color: #1E3A8A; font-size: 26px; } h2 { font-size: 19px; margin-top: 28px; }
  .card { background: #fff; border: 1px solid #E5E7EB; border-radius: 14px; padding: 16px; }
  label { display: block; font-weight: 600; margin: 12px 0 4px; }
  input { width: 100%; box-sizing: border-box; font-size: 16px; padding: 12px; border: 1px solid #D1D5DB; border-radius: 10px; }
  button { margin-top: 16px; width: 100%; font-size: 16px; padding: 14px; border: 0; border-radius: 10px; background: #B91C1C; color: #fff; font-weight: 600; }
  .ok { color: #166534; } .err { color: #B91C1C; } .muted { color: #6B7280; font-size: 14px; }
</style></head><body><main>${body}</main></body></html>`;
}

function contact() {
  return config.contactEmail
    ? `email <a href="mailto:${escape(config.contactEmail)}">${escape(config.contactEmail)}</a>`
    : 'use the contact details on the app\'s store page';
}

router.get('/privacy', (req, res) => {
  res.send(page('Privacy policy', `
<h1>Privacy policy</h1>
<p class="muted">Astana Issue Reporter · last updated ${UPDATED}</p>
<p>Astana Issue Reporter lets residents of Astana report city problems (potholes, broken street lights, trash) with a photo and a point on the map, like other reports and follow their status. It is an unofficial student project of Astana IT University, not affiliated with the city administration of Astana.</p>

<h2>What we collect</h2>
<ul>
  <li><b>Account:</b> your email, the name you enter and your password. The password is stored only as a salted PBKDF2 hash, never as plain text.</li>
  <li><b>Reports you submit:</b> the photo, the category, your description and the map location of the problem.</li>
  <li><b>Likes</b> you give to reports and <b>notifications</b> about status changes of your reports.</li>
</ul>
<p>The app uses your device's <b>location</b> only while you create a report, to put the problem on the map. Your location is not tracked in the background and is not stored apart from the report you submit. The <b>camera and photo library</b> are used only to attach the photo you choose.</p>
<p>We do not collect contacts, advertising identifiers or analytics, we do not show ads and we do not sell or share your data with third parties for marketing.</p>

<h2>Who can see it</h2>
<p>Reports are public inside the app: other users and city service staff see the photo, category, description, location, status and your display name. Your email and password are never shown to other users.</p>

<h2>Where it is stored</h2>
<p>Data is stored in a PostgreSQL database and file storage provided by Supabase (EU, Frankfurt), and processed by our server hosted on Render. Connections use HTTPS.</p>

<h2>How long we keep it</h2>
<p>We keep your data while your account exists. When you delete your account, your account, reports, photos, likes and notifications are deleted right away.</p>

<h2>Moderation</h2>
<p>Complaints you send with <b>Report content</b> and the list of authors you block are stored to moderate content and to hide it for you. Rules for content are in the <a href="/terms">terms of use</a>.</p>

<h2>Deleting your account</h2>
<p>In the app: <b>Profile → Delete account</b>. Without the app: <a href="/delete-account">delete your account on the web</a>.</p>

<h2>Children</h2>
<p>The app is not intended for children under 13.</p>

<h2>Contact</h2>
<p>For questions about your data, ${contact()}.</p>
`));
});

router.get('/terms', (req, res) => {
  res.send(page('Terms of use', `
<h1>Terms of use</h1>
<p class="muted">Astana Issue Reporter · last updated ${UPDATED}</p>
<p>By creating an account you agree to these rules. Astana Issue Reporter is an unofficial student project of Astana IT University and is not affiliated with the city administration (akimat) of Astana.</p>

<h2>What you may post</h2>
<p>Only real city problems: a photo of the problem, its location and a short description.</p>

<h2>Zero tolerance for objectionable content</h2>
<p>Do not post offensive, abusive, hateful, sexual or violent content, photos of people that could identify them without their consent, personal data of others, spam or advertising. Such content is removed and the account that posted it can be deleted without warning.</p>

<h2>Reporting and blocking</h2>
<p>On any report you can tap <b>Report content</b> to send it to moderators, and <b>Block author</b> to stop seeing that person's reports. Moderators review complaints within 24 hours. A report with several complaints is hidden until it is reviewed.</p>

<h2>Your content</h2>
<p>Reports you post are visible to all users of the app. You can delete your account and all your content at any time in Profile → Delete account.</p>

<h2>No warranty</h2>
<p>The service is provided as is. Posting a report does not oblige the city services to act on it.</p>

<h2>Contact</h2>
<p>To report abuse or ask a question, ${contact()}. See also the <a href="/privacy">privacy policy</a>.</p>
`));
});

function deleteForm(message = '') {
  return page('Delete account', `
<h1>Delete your account</h1>
<div class="card">
  <p>This permanently deletes your Astana Issue Reporter account together with your reports, photos, likes and notifications. It cannot be undone.</p>
  <p class="muted">You can also do this in the app: Profile → Delete account.</p>
  ${message}
  <form method="post" action="/delete-account">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="email" required>
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required>
    <button type="submit">Delete my account</button>
  </form>
</div>
<p class="muted">Forgot your password? Please ${contact()} from the email of your account and we will delete it by hand.</p>
`);
}

router.get('/delete-account', (req, res) => res.send(deleteForm()));

router.post('/delete-account', express.urlencoded({ extended: false, limit: '5kb' }), async (req, res) => {
  const result = await deleteAccount(req.body.email, req.body.password);
  if (result.admin) return res.status(403).send(deleteForm('<p class="err">Staff accounts cannot be deleted here.</p>'));
  if (!result.ok) return res.status(400).send(deleteForm('<p class="err">Wrong email or password.</p>'));
  res.send(page('Account deleted', '<h1>Account deleted</h1><p class="ok">Your account and all its data have been deleted.</p>'));
});

module.exports = router;
