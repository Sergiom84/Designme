import { Columns2, Copy, Download, Maximize2, Monitor, RotateCcw, Smartphone, Tablet } from 'lucide-react';
import type { PreviewMode, PreviewZoom } from '../types/app';

interface CanvasToolbarProps {
  title: string;
  summary: string;
  previewMode: PreviewMode;
  previewZoom: PreviewZoom;
  canvasOnly: boolean;
  hasCompare: boolean;
  onPreviewModeChange(mode: PreviewMode): void;
  onPreviewZoomChange(zoom: PreviewZoom): void;
  onToggleCanvasOnly(): void;
  onClearCompare(): void;
  onResetView(): void;
  onCopyHandoff(): void;
  onExportHtml(): void;
  onExportBundle(): void;
}

export function CanvasToolbar({
  title,
  summary,
  previewMode,
  previewZoom,
  canvasOnly,
  hasCompare,
  onPreviewModeChange,
  onPreviewZoomChange,
  onToggleCanvasOnly,
  onClearCompare,
  onResetView,
  onCopyHandoff,
  onExportHtml,
  onExportBundle,
}: CanvasToolbarProps) {
  const previewSizeLabel =
    previewMode === 'desktop' ? 'Canvas desktop' : previewMode === 'tablet' ? 'Canvas tablet' : 'Canvas móvil';

  return (
    <header className="canvas-toolbar">
      <div>
        <span>{previewSizeLabel}</span>
        <h1>{title}</h1>
        <p>{summary}</p>
      </div>
      <div className="toolbar-actions">
        <div className="icon-segment" aria-label="Modo de preview">
          <button
            type="button"
            title="Desktop"
            aria-label="Preview desktop"
            aria-pressed={previewMode === 'desktop'}
            className={previewMode === 'desktop' ? 'active' : ''}
            onClick={() => onPreviewModeChange('desktop')}
          >
            <Monitor size={18} aria-hidden />
          </button>
          <button
            type="button"
            title="Tablet"
            aria-label="Preview tablet"
            aria-pressed={previewMode === 'tablet'}
            className={previewMode === 'tablet' ? 'active' : ''}
            onClick={() => onPreviewModeChange('tablet')}
          >
            <Tablet size={18} aria-hidden />
          </button>
          <button
            type="button"
            title="Móvil"
            aria-label="Preview móvil"
            aria-pressed={previewMode === 'mobile'}
            className={previewMode === 'mobile' ? 'active' : ''}
            onClick={() => onPreviewModeChange('mobile')}
          >
            <Smartphone size={18} aria-hidden />
          </button>
        </div>

        <div className="zoom-segment" aria-label="Zoom de preview">
          {(['fit', '50', '75', '100'] as PreviewZoom[]).map((zoom) => (
            <button
              key={zoom}
              type="button"
              className={previewZoom === zoom ? 'active' : ''}
              aria-pressed={previewZoom === zoom}
              onClick={() => onPreviewZoomChange(zoom)}
            >
              {zoom === 'fit' ? 'Fit' : `${zoom}%`}
            </button>
          ))}
        </div>

        <button type="button" className="icon-button" title="Reset view" aria-label="Reset view" onClick={onResetView}>
          <RotateCcw size={17} aria-hidden />
        </button>
        <button
          type="button"
          className="icon-button"
          title={canvasOnly ? 'Mostrar paneles' : 'Solo canvas'}
          aria-label={canvasOnly ? 'Mostrar paneles' : 'Solo canvas'}
          aria-pressed={canvasOnly}
          onClick={onToggleCanvasOnly}
        >
          <Maximize2 size={17} aria-hidden />
        </button>
        {hasCompare ? (
          <button type="button" className="command-button" onClick={onClearCompare}>
            <Columns2 size={17} aria-hidden />
            <span>Salir compare</span>
          </button>
        ) : null}
        <button type="button" className="command-button" onClick={onCopyHandoff}>
          <Copy size={17} aria-hidden />
          <span>Copy handoff</span>
        </button>
        <button type="button" className="command-button primary" onClick={onExportHtml}>
          <Download size={17} aria-hidden />
          <span>Export HTML</span>
        </button>
        <button type="button" className="command-button" onClick={onExportBundle}>
          <Download size={17} aria-hidden />
          <span>Export bundle</span>
        </button>
      </div>
    </header>
  );
}
