const FENCE_PATTERN = /```html\s*([\s\S]*?)```/gi;
const DOCUMENT_PATTERN = /<!doctype\s+html[\s\S]*?<\/html>/i;
// Structural smell test for the extracted document. We do NOT run a full HTML5
// validator (too heavy, too lenient parser anyway), but we require the four
// load-bearing tags so a truncated document does not silently render a blank
// iframe. The check is intentionally case-insensitive to match LLM output.
const STRUCTURAL_TAGS = [/<html[\s>]/i, /<\/html>/i, /<body[\s>]/i, /<\/body>/i];

function isStructurallyValid(html: string): boolean {
  return STRUCTURAL_TAGS.every((pattern) => pattern.test(html));
}

/**
 * Pulls a complete <!doctype html> ... </html> document out of free-form LLM
 * output. Scans every ```html fenced block plus the raw text, then returns
 * the longest valid candidate so multi-block responses (e.g. "option A vs
 * option B" or "draft + revised") yield the final, fullest document instead
 * of the first stub.
 *
 * Returns an empty string when no candidate envelope is found so callers can
 * branch on truthiness without dealing with `null`. The error message is
 * provided separately by {@link INVALID_HTML_ERROR_MESSAGE} so all providers
 * surface the same retryable signal to `useGenerate`.
 */
export function extractStandaloneHtmlDocument(text: string): string {
  if (typeof text !== 'string' || text.length === 0) {
    return '';
  }

  const candidates: string[] = [];
  FENCE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FENCE_PATTERN.exec(text)) !== null) {
    candidates.push(match[1]);
  }
  candidates.push(text);

  let best = '';
  for (const candidate of candidates) {
    const docMatch = candidate.match(DOCUMENT_PATTERN);
    if (!docMatch) continue;
    const html = docMatch[0].trim();
    if (!isStructurallyValid(html)) continue;
    if (html.length > best.length) {
      best = html;
    }
  }
  return best;
}

/**
 * Shared error string emitted by every external provider when the LLM did not
 * return a parseable standalone HTML document. `useGenerate` watches for this
 * exact prefix to trigger an automatic one-shot retry with a stricter format
 * hint appended to the prompt.
 */
export const INVALID_HTML_ERROR_MESSAGE =
  'Provider did not return a complete standalone HTML document.';
