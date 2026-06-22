const { createAdminClient } = require('@insforge/sdk');
require('dotenv').config({ path: '.env.local' });

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;

const admin = createAdminClient({ baseUrl, apiKey });

async function run() {
  try {
    const tables = ['users', 'integrations', 'briefings', 'schedules', 'briefing_schedules', 'briefings_list'];
    for (const table of tables) {
      const { data, error } = await admin.database
        .from(table)
        .select('*')
        .limit(1);
      if (error) {
        console.log(`Table "${table}": Error / Does not exist -`, error.message);
      } else {
        console.log(`Table "${table}": Exists! Data sample:`, data);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
