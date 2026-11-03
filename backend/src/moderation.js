// Moderation rules for user content (app store requirement for apps where users post photos and text)

// A report with this many complaints is hidden from residents until an admin keeps or deletes it
const HIDE_AFTER_FLAGS = 3;

// SQL condition: which reports the user $1 may see. Admins see everything; a resident always sees their own reports
// and does not see reports they complained about, reports of authors they blocked, or reports hidden by complaints
function visibleTo(isAdmin) {
  if (isAdmin) return 'TRUE';
  return `(r.user_id = $1 OR (
    NOT EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id = $1 AND b.blocked_id = r.user_id)
    AND NOT EXISTS (SELECT 1 FROM report_flags f WHERE f.report_id = r.id AND f.user_id = $1)
    AND (SELECT COUNT(*) FROM report_flags f WHERE f.report_id = r.id) < ${HIDE_AFTER_FLAGS}))`;
}

// Simple filter of rude words in English, Russian and Kazakh (roots, so word forms are caught too)
const RUDE = [
  /\bfuck/i, /\bshit/i, /\bcunt/i, /\bbitch/i, /\basshole/i, /\bnigg/i, /\bfaggot/i,
  /х[уy][йяеёию]/i, /п[иi]зд/i, /(^|[^а-яё])[её]б[аеиуыляё]/i, /(^|[^а-яё])бля/i, /муда[кч]/i, /пид[оа]р/i, /залуп/i, /шлюх/i,
  /сігу/i, /қотақ/i, /амыңды/i,
];
const hasRudeWords = (text) => RUDE.some((re) => re.test(text));

module.exports = { HIDE_AFTER_FLAGS, visibleTo, hasRudeWords };
