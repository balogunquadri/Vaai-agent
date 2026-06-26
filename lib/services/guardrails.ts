/**
 * V-AI Guardrails Engine
 * Handles prompt injection mitigation, PII redaction, and output moderation checking.
 */

// Prohibited injection patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:previous|system|above|guidelines|instructions|rules)/i,
  /reveal\s+(?:system|prompt|developer|initial\s+system)/i,
  /bypass\s+(?:safety|constraints|filters|guardrails)/i,
  /override\s+(?:constraints|system\s+instructions)/i,
  /acting\s+as\s+(?:developer\s+mode|dan\s+|jailbreak)/i,
  /you\s+are\s+now\s+unbound/i
];

// Content safety / toxicity flags
const PROHIBITED_OUTPUT_KEYWORDS = [
  /\b(?:nigger|chink|kike|faggot|spic)\b/i, // hate speech
  /\b(?:porn|pornography|hentai|sexually\s+explicit)\b/i, // adult content
  /\b(?:exploding|bomb\s+recipe|make\s+meth|create\s+virus)\b/i // dangerous actions
];

/**
 * Validates user input to prevent prompt injection and jailbreak overrides.
 */
export function sanitizeInput(prompt: string): { clean: boolean; reason?: string } {
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      console.warn(`[Guardrails] Blocked input due to pattern match:`, pattern);
      return {
        clean: false,
        reason: "Potential Prompt Injection or System Bypass attempt detected."
      };
    }
  }
  return { clean: true };
}

/**
 * Scans and redacts Personally Identifiable Information (PII) and secret credentials from prompts.
 */
export function redactPII(text: string): string {
  let redacted = text;

  // 1. Credit Card Numbers (13 to 16 digits)
  const ccRegex = /\b(?:\d[ -]*?){13,16}\b/g;
  redacted = redacted.replace(ccRegex, "[REDACTED_CREDIT_CARD]");

  // 2. US Social Security Numbers (SSN)
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  redacted = redacted.replace(ssnRegex, "[REDACTED_SSN]");

  // 3. API Keys and Tokens
  // - Gemini keys (AIzaSy...)
  const geminiKeyRegex = /\b(AIzaSy[a-zA-Z0-9-_]{35})\b/g;
  redacted = redacted.replace(geminiKeyRegex, "[REDACTED_GEMINI_API_KEY]");
  // - Generic Bearer API tokens
  const genericKeyRegex = /\b(sk-[a-zA-Z0-9]{20,})\b/g;
  redacted = redacted.replace(genericKeyRegex, "[REDACTED_API_KEY]");
  // - GitHub Personal Access Tokens (ghp_...)
  const githubTokenRegex = /\bghp_[a-zA-Z0-9]{36}\b/g;
  redacted = redacted.replace(githubTokenRegex, "[REDACTED_GITHUB_TOKEN]");

  // 4. Phone Numbers (Standard formats)
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  redacted = redacted.replace(phoneRegex, "[REDACTED_PHONE]");

  // 5. In-line passwords/secrets key-value structures
  const secretAssignRegex = /(?:password|passwd|secret|api_key|apikey|token|private_key)\s*[:=]\s*["']?([a-zA-Z0-9\-_\.~!\@\#\$\%\^\&\*\(\)\+]{6,})["']?/gi;
  redacted = redacted.replace(secretAssignRegex, (match, secretVal) => {
    return match.replace(secretVal, "[REDACTED_SECRET]");
  });

  return redacted;
}

/**
 * Checks and moderates LLM output generated text before returning it to the user.
 */
export function moderateOutput(text: string): { safe: boolean; text: string } {
  for (const pattern of PROHIBITED_OUTPUT_KEYWORDS) {
    if (pattern.test(text)) {
      console.warn(`[Guardrails] Blocked output due to policy violation:`, pattern);
      return {
        safe: false,
        text: "⚠️ I am sorry, but the response was blocked as it contained content violating workspace safety guidelines."
      };
    }
  }
  return { safe: true, text };
}
