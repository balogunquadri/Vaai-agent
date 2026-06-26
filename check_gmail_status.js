const { createAdminClient } = require('@insforge/sdk');
require('dotenv').config({ path: '.env.local' });

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;

const admin = createAdminClient({ baseUrl, apiKey });

async function run() {
  try {
    console.log("Checking database...");
    
    // Fetch users
    const { data: users, error: userError } = await admin.database
      .from('users')
      .select('id, email, confirmed');
      
    if (userError) {
      console.error("Error fetching users:", userError.message);
    } else {
      console.log("\n--- Users ---");
      console.log(users);
    }

    // Fetch gmail integrations
    const { data: integrations, error: integrationError } = await admin.database
      .from('integrations')
      .select('id, user_id, platform, connected, state');

    if (integrationError) {
      console.error("Error fetching integrations:", integrationError.message);
    } else {
      console.log("\n--- Integrations (Gmail & others) ---");
      integrations.forEach(row => {
        let stateObj = null;
        if (row.state) {
          try {
            stateObj = typeof row.state === 'string' ? JSON.parse(row.state) : row.state;
          } catch(e) {
            stateObj = "Unparseable";
          }
        }
        console.log({
          id: row.id,
          user_id: row.user_id,
          platform: row.platform,
          connected: row.connected,
          hasState: !!row.state,
          hasAccessToken: !!stateObj?.access_token,
          hasRefreshToken: !!stateObj?.refresh_token,
          expiresAt: stateObj?.expires_at ? new Date(stateObj.expires_at).toISOString() : null,
          expiresAtMs: stateObj?.expires_at
        });
      });
    }

  } catch (err) {
    console.error(err);
  }
}

run();
