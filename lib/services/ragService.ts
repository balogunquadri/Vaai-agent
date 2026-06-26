import { createAdminClient } from "@insforge/sdk";

// Basic English stop words to filter out before keyword matching
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "can't", "cannot",
  "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few",
  "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll",
  "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
  "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most",
  "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
  "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't",
  "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
  "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
  "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't",
  "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's",
  "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
  "yourselves", "show", "me", "find", "get", "list", "search", "read"
]);

/**
 * Extracts searchable keywords from a query string.
 */
function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // strip punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Recursively extracts all string values from a nested state object.
 */
function extractTextValues(obj: any): string[] {
  const texts: string[] = [];
  if (!obj) return texts;

  if (typeof obj === "string") {
    texts.push(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach(item => texts.push(...extractTextValues(item)));
  } else if (typeof obj === "object") {
    Object.values(obj).forEach(val => texts.push(...extractTextValues(val)));
  }
  return texts;
}

interface RagContextItem {
  platform: string;
  title: string;
  snippet: string;
  score: number;
  time?: string;
}

/**
 * Queries the user's integrations database to compile relevant contextual RAG background.
 */
export async function retrieveRagContext(userId: string, query: string): Promise<string> {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) {
    return "";
  }

  console.log(`[RAG Service] Extracting context for query "${query}". Keywords:`, keywords);

  try {
    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    // 1. Fetch user's integrations logs and active feed items
    const { data: rows, error } = await admin.database
      .from("integrations")
      .select()
      .eq("user_id", userId);

    if (error || !rows) {
      console.warn("[RAG Service] Failed to retrieve integrations database logs:", error);
      return "";
    }

    const matches: RagContextItem[] = [];

    // 2. Score and search through row state fields in memory
    for (const row of rows) {
      const state = row.state;
      if (!state) continue;

      const platform = row.platform || "unknown";
      
      // We skip cache records and job records to avoid matching telemetry logs
      if (platform === "spy_cache" || platform === "spy_job" || platform === "llm_observability") {
        continue;
      }

      const allTexts = extractTextValues(state);
      const combinedText = allTexts.join(" ").toLowerCase();

      let score = 0;
      keywords.forEach(keyword => {
        if (combinedText.includes(keyword)) {
          // Count word occurrences for basic relevance weighting
          const occurrences = combinedText.split(keyword).length - 1;
          score += occurrences;
        }
      });

      if (score > 0) {
        // Build a readable title and content snippet
        const title = state.title || state.name || state.scheduleName || `${platform.toUpperCase()} Item`;
        
        let snippet = "";
        if (state.description) snippet = state.description;
        else if (state.summaryText) snippet = state.summaryText;
        else if (state.lastMessage) snippet = state.lastMessage;
        else if (state.text) snippet = state.text;
        else if (state.body) snippet = state.body;
        else {
          // Fallback: join first few extracted text elements
          snippet = allTexts.slice(0, 3).join(" | ");
        }

        // Truncate snippet
        if (snippet.length > 250) {
          snippet = snippet.substring(0, 247) + "...";
        }

        matches.push({
          platform,
          title,
          snippet,
          score,
          time: state.time || state.createdAt || state.updated_at || row.updated_at
        });
      }
    }

    if (matches.length === 0) {
      return "";
    }

    // 3. Sort by relevance score desc and take top 5 matches
    const topMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 4. Compile into Markdown context block
    let contextBlock = "\n### 🔍 Relevant Workspace Context (RAG)\n";
    contextBlock += "The following relevant logs and updates were retrieved from the user's integrations:\n\n";

    topMatches.forEach((match, idx) => {
      const timeStr = match.time ? ` (${new Date(match.time).toLocaleDateString()})` : "";
      contextBlock += `${idx + 1}. **${match.title}** [Platform: *${match.platform}*]${timeStr}\n`;
      contextBlock += `   *Content:* "${match.snippet}"\n\n`;
    });

    console.log(`[RAG Service] Found ${topMatches.length} matching workspace logs for prompt context.`);
    return contextBlock;

  } catch (err) {
    console.error("[RAG Service] Search retrieval failed:", err);
    return "";
  }
}
