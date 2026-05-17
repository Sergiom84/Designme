import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { PreviewComment, PreviewCommentTarget } from '../comments';
import type { PreviewMode } from '../types/app';
import { classNames } from '../utils/classNames';

interface PreviewStageProps {
  previewMode: PreviewMode;
  html: string;
  compareHtml?: string;
  compareName?: string;
  zoomScale: number;
  commentMode?: boolean;
  comments?: PreviewComment[];
  onCreateComment?(target: PreviewCommentTarget, note: string): void;
  onResolveComment?(commentId: string): void;
}

const COMMENT_PROTOCOL = 'designme-preview-comments';
const COMMENT_VERSION = 1;

interface PendingComment {
  target: PreviewCommentTarget;
}

interface PreviewCommentClickMessage {
  protocol: typeof COMMENT_PROTOCOL;
  version: typeof COMMENT_VERSION;
  type: 'target-click';
  nonce: string;
  target: {
    selector?: string;
    tagName?: string;
    textSnippet?: string;
    ariaLabel?: string;
    role?: string;
    className?: string;
  };
  pointer: {
    xRatio: number;
    yRatio: number;
  };
  elementRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

function clampRatio(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function safeText(value: unknown, maxLength = 240): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCommentClickMessage(value: unknown, nonce: string): value is PreviewCommentClickMessage {
  if (!isRecord(value)) return false;
  const data = value;
  const pointer = data.pointer;
  const elementRect = data.elementRect;

  return (
    data.protocol === COMMENT_PROTOCOL &&
    data.version === COMMENT_VERSION &&
    data.type === 'target-click' &&
    data.nonce === nonce &&
    isRecord(data.target) &&
    isRecord(pointer) &&
    isRecord(elementRect) &&
    clampRatio(pointer.xRatio) !== undefined &&
    clampRatio(pointer.yRatio) !== undefined &&
    isFiniteNumber(elementRect.x) &&
    isFiniteNumber(elementRect.y) &&
    isFiniteNumber(elementRect.width) &&
    isFiniteNumber(elementRect.height)
  );
}

function createNonce(): string {
  return globalThis.crypto?.randomUUID?.() ?? `preview-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createNonceForHtml(html: string): string {
  return `${createNonce()}-${html.length}`;
}

function escapeScriptString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/<\/script/gi, '<\\/script');
}

function instrumentPreviewHtml(html: string, nonce: string): string {
  const script = `<script>
(function () {
  var protocol = '${COMMENT_PROTOCOL}';
  var version = ${COMMENT_VERSION};
  var nonce = '${escapeScriptString(nonce)}';

  function clip(value, max) {
    if (typeof value !== 'string') return undefined;
    var next = value.replace(/\\s+/g, ' ').trim();
    return next ? next.slice(0, max || 240) : undefined;
  }

  function selectorFor(element) {
    if (!element || !element.tagName) return undefined;
    var escapeCss = window.CSS && CSS.escape ? CSS.escape : function (value) { return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\\\$&'); };
    if (element.id) return '#' + escapeCss(element.id);
    var testId = element.getAttribute('data-testid') || element.getAttribute('data-preview-id');
    if (testId) return '[' + (element.getAttribute('data-testid') ? 'data-testid' : 'data-preview-id') + '="' + escapeCss(testId) + '"]';
    var className = typeof element.className === 'string' ? element.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
    var base = element.tagName.toLowerCase() + (className ? '.' + className : '');
    return base;
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('a, button, input, textarea, select, [role], section, article, main, header, footer, div, span, h1, h2, h3, p') : event.target;
    if (!target || !target.getBoundingClientRect) return;
    event.preventDefault();
    event.stopPropagation();
    var rect = target.getBoundingClientRect();
    var width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
    var height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    window.parent.postMessage({
      protocol: protocol,
      version: version,
      type: 'target-click',
      nonce: nonce,
      target: {
        selector: selectorFor(target),
        tagName: clip(target.tagName && target.tagName.toLowerCase(), 32),
        textSnippet: clip(target.innerText || target.textContent, 180),
        ariaLabel: clip(target.getAttribute && target.getAttribute('aria-label'), 120),
        role: clip(target.getAttribute && target.getAttribute('role'), 80),
        className: clip(typeof target.className === 'string' ? target.className : '', 160)
      },
      pointer: {
        xRatio: Math.max(0, Math.min(1, event.clientX / width)),
        yRatio: Math.max(0, Math.min(1, event.clientY / height))
      },
      elementRect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }
    }, '*');
  }, true);
})();
</script>`;

  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${script}</body>`) : `${html}${script}`;
}

function targetFromMessage(message: PreviewCommentClickMessage): PreviewCommentTarget {
  const xRatio = clampRatio(message.pointer.xRatio) ?? 0.5;
  const yRatio = clampRatio(message.pointer.yRatio) ?? 0.5;

  return {
    selector: safeText(message.target.selector),
    label: safeText(message.target.ariaLabel) ?? safeText(message.target.role) ?? safeText(message.target.tagName),
    textSnippet: safeText(message.target.textSnippet),
    xRatio,
    yRatio,
    rect: {
      x: message.elementRect.x,
      y: message.elementRect.y,
      width: Math.max(1, message.elementRect.width),
      height: Math.max(1, message.elementRect.height),
    },
  };
}

function positionStyle(target: PreviewCommentTarget): CSSProperties {
  const x = Math.round((target.xRatio ?? 0.5) * 1000) / 10;
  const y = Math.round((target.yRatio ?? 0.5) * 1000) / 10;
  return { left: `${x}%`, top: `${y}%` };
}

export function PreviewStage({
  previewMode,
  html,
  compareHtml,
  compareName,
  zoomScale,
  commentMode = false,
  comments = [],
  onCreateComment,
  onResolveComment,
}: PreviewStageProps) {
  return (
    <section
      className={classNames(
        'preview-stage',
        `mode-${previewMode}`,
        compareHtml && 'is-comparing',
        commentMode && 'is-commenting',
      )}
      aria-label="Vista previa"
      tabIndex={0}
      style={{ '--preview-scale': String(zoomScale) } as CSSProperties}
    >
      <PreviewFrame
        key={commentMode ? 'main-commenting' : 'main-preview'}
        title="Vista previa del diseño"
        html={html}
        commentMode={commentMode}
        comments={comments}
        onCreateComment={onCreateComment}
        onResolveComment={onResolveComment}
      />
      {compareHtml ? <PreviewFrame title={`Comparativa ${compareName ?? 'guardada'}`} html={compareHtml} /> : null}
    </section>
  );
}

function PreviewFrame({
  title,
  html,
  commentMode = false,
  comments = [],
  onCreateComment,
  onResolveComment,
}: {
  title: string;
  html: string;
  commentMode?: boolean;
  comments?: PreviewComment[];
  onCreateComment?(target: PreviewCommentTarget, note: string): void;
  onResolveComment?(commentId: string): void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const nonce = useMemo(() => createNonceForHtml(html), [html]);
  const srcDoc = useMemo(() => (commentMode ? instrumentPreviewHtml(html, nonce) : html), [commentMode, html, nonce]);
  const [pendingComment, setPendingComment] = useState<PendingComment | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!commentMode) return undefined;

    function handleMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isCommentClickMessage(event.data, nonce)) return;
      setPendingComment({ target: targetFromMessage(event.data) });
      setNote('');
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [commentMode, nonce]);

  function saveComment() {
    if (!pendingComment || !note.trim()) return;
    onCreateComment?.(pendingComment.target, note);
    setPendingComment(null);
    setNote('');
  }

  return (
    <div className="iframe-shell">
      <iframe ref={iframeRef} title={title} srcDoc={srcDoc} sandbox="allow-scripts" referrerPolicy="no-referrer" />
      {commentMode ? (
        <div className="preview-comment-layer" aria-label="Comentarios de preview">
          {comments.map((comment, index) => (
            <div key={comment.id} className="preview-comment-pin" style={positionStyle(comment.target)}>
              <button type="button" aria-label={`Comentario ${index + 1}: ${comment.note}`}>
                {index + 1}
              </button>
              <div className="preview-comment-popover">
                <p>{comment.note}</p>
                <button type="button" className="text-button" onClick={() => onResolveComment?.(comment.id)}>
                  Resolver
                </button>
              </div>
            </div>
          ))}
          {pendingComment ? (
            <form
              className="preview-comment-composer"
              style={positionStyle(pendingComment.target)}
              onSubmit={(event) => {
                event.preventDefault();
                saveComment();
              }}
            >
              <label>
                <span>Comentario</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} autoFocus />
              </label>
              <div>
                <button type="submit" className="command-button primary" disabled={!note.trim()}>
                  Guardar
                </button>
                <button
                  type="button"
                  className="command-button"
                  onClick={() => {
                    setPendingComment(null);
                    setNote('');
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
