require('dotenv').config();
const cron = require('node-cron');
const { exec } = require('child_process');

/**
 * Runs the mood aggregation job on a schedule. Deploy this as a separate
 * long-running process (or swap for your host's native cron / scheduled
 * function, e.g. Render Cron Jobs, Railway Cron, or an Atlas Trigger) -
 * don't run it inside the main API process, since a crash here shouldn't
 * take down request handling.
 *
 * Default: every hour, on the hour.
 */
const SCHEDULE = process.env.AGGREGATION_CRON || '0 * * * *';

console.log(`Mood aggregation scheduler started. Cron: "${SCHEDULE}"`);

cron.schedule(SCHEDULE, () => {
  console.log(`[${new Date().toISOString()}] Running mood aggregation...`);
  exec('node utils/aggregateMood.js', (err, stdout, stderr) => {
    if (err) {
      console.error('Aggregation job failed:', stderr || err.message);
      return;
    }
    console.log(stdout.trim());
  });
});
