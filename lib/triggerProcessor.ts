// Lightweight trigger processor stub.
// This module provides a simple processor that will execute a trigger's action chain.
// Currently it runs actions sequentially and returns a report. Integrations should
// call real adapters or tools (Gmail/Slack/Google Docs/AI) in production.

export async function processTrigger(triggerSpec: any, payload: any) {
  const results: any[] = [];

  const actions = triggerSpec?.actions || [];
  for (const action of actions) {
    try {
      if (action.type === 'extract_action_items') {
        // In production: call AI/text-extraction service on payload.transcript
        const transcript = payload?.transcript || payload?.text || '';
        // Stub: split sentences that contain verbs like 'do' or 'please'
        const items = transcript
          .split(/[\.\n]/)
          .map(s => s.trim())
          .filter(s => s.length > 10)
          .slice(0, 10);
        results.push({ action: 'extract_action_items', ok: true, items });
      } else if (action.type === 'save_to_google_docs') {
        // In production: call Google Docs API to create a doc and insert content
        const docTitle = action.params?.title || `Trigger Export ${Date.now()}`;
        const content = action.params?.content || payload?.summary || payload?.transcript || '';
        // Stub: return a fake URL
        const url = `https://docs.google.com/document/d/${Buffer.from(docTitle).toString('hex')}`;
        results.push({ action: 'save_to_google_docs', ok: true, doc: { title: docTitle, url } });
      } else if (action.type === 'notify_slack') {
        const channel = action.params?.channel || '#general';
        const message = action.params?.message || `Automated notification from trigger: ${triggerSpec.name || 'unnamed'}`;
        // In production: call Slack adapter to post message
        results.push({ action: 'notify_slack', ok: true, channel, message });
      } else {
        results.push({ action: action.type, ok: false, error: 'Unknown action type' });
      }
    } catch (err: any) {
      results.push({ action: action.type, ok: false, error: err.message || String(err) });
    }
  }

  return { trigger: triggerSpec?.name || null, results };
}
