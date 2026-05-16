import type { PreviewMode } from '../types/app';
import type { CSSProperties } from 'react';
import { classNames } from '../utils/classNames';

interface PreviewStageProps {
  previewMode: PreviewMode;
  html: string;
  compareHtml?: string;
  compareName?: string;
  zoomScale: number;
}

export function PreviewStage({ previewMode, html, compareHtml, compareName, zoomScale }: PreviewStageProps) {
  return (
    <section
      className={classNames('preview-stage', `mode-${previewMode}`, compareHtml && 'is-comparing')}
      aria-label="Vista previa"
      style={{ '--preview-scale': String(zoomScale) } as CSSProperties}
    >
      <PreviewFrame title="Vista previa del diseño" html={html} />
      {compareHtml ? <PreviewFrame title={`Comparativa ${compareName ?? 'guardada'}`} html={compareHtml} /> : null}
    </section>
  );
}

function PreviewFrame({ title, html }: { title: string; html: string }) {
  return (
    <div className="iframe-shell">
      <iframe title={title} srcDoc={html} sandbox="allow-scripts allow-same-origin" />
    </div>
  );
}
