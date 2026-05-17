const FENCE_PATTERN = /```html\s*([\s\S]*?)```/gi;
const DOCUMENT_PATTERN = /<!doctype\s+html[\s\S]*?<\/html>/i;
// Mirror of `src/providers/htmlExtraction.ts`: load-bearing tags must be
// present in the extracted document or we reject it as truncated/corrupt and
// let the renderer-side retry kick in.
const STRUCTURAL_TAGS = [/<html[\s>]/i, /<\/html>/i, /<body[\s>]/i, /<\/body>/i];

function isStructurallyValid(html) {
  return STRUCTURAL_TAGS.every((pattern) => pattern.test(html));
}

/**
 * Pulls a complete <!doctype html> ... </html> document out of free-form LLM
 * output. Scans every ```html fenced block plus the raw text, then returns the
 * longest valid candidate so multi-block responses (e.g. "option A vs option
 * B" or "draft + revised") yield the final, fullest document instead of the
 * first stub.
 *
 * Returns `null` when no candidate envelope is found so the caller can surface
 * a clear error event instead of feeding partial HTML into the preview frame.
 */
function extractStandaloneHtmlDocument(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return null;
  }

  const candidates = [];
  FENCE_PATTERN.lastIndex = 0;
  let fenceMatch;
  while ((fenceMatch = FENCE_PATTERN.exec(text)) !== null) {
    candidates.push(fenceMatch[1]);
  }
  candidates.push(text);

  let best = null;
  for (const candidate of candidates) {
    const docMatch = candidate.match(DOCUMENT_PATTERN);
    if (!docMatch) continue;
    const html = docMatch[0].trim();
    if (!isStructurallyValid(html)) continue;
    if (!best || html.length > best.length) {
      best = html;
    }
  }
  return best;
}

module.exports = {
  extractStandaloneHtmlDocument,
};
