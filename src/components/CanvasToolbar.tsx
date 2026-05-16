import { Columns2, Copy, Download, Maximize2, Monitor, RotateCcw, Smartphone, Tablet } from 'lucide-react';
import type { PreviewMode, PreviewZoom } from '../types/app';
import { es } from '../i18n';

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
    previewMode === 'desktop'
      ? es.toolbar.titleByMode.desktop
      : previewMode === 'tablet'
        ? es.toolbar.titleByMode.tablet
        : es.toolbar.titleByMode.mobile;

  return (
    <header className="canvas-toolbar">
      <div>
        <span>{previewSizeLabel}</span>
        <h1>{title}</h1>
        <p>{summary}</p>
      </div>
      <div className="toolbar-actions" role="toolbar" aria-label={es.toolbar.controlsLabel}>
        <div className="icon-segment" role="group" aria-label={es.toolbar.previewModeLabel}>
          <button
            type="button"
            title="Desktop"
            aria-label={es.toolbar.previewDesktop}
            aria-pressed={previewMode === 'desktop'}
            className={previewMode === 'desktop' ? 'active' : ''}
            onClick={() => onPreviewModeChange('desktop')}
          >
            <Monitor size={18} aria-hidden />
          </button>
          <button
            type="button"
            title="Tablet"
            aria-label={es.toolbar.previewTablet}
            aria-pressed={previewMode === 'tablet'}
            className={previewMode === 'tablet' ? 'active' : ''}
            onClick={() => onPreviewModeChange('tablet')}
          >
            <Tablet size={18} aria-hidden />
          </button>
          <button
            type="button"
            title="Móvil"
            aria-label={es.toolbar.previewMobile}
            aria-pressed={previewMode === 'mobile'}
            className={previewMode === 'mobile' ? 'active' : ''}
            onClick={() => onPreviewModeChange('mobile')}
          >
            <Smartphone size={18} aria-hidden />
          </button>
        </div>

        <div className="zoom-segment" role="group" aria-label={es.toolbar.zoomLabel}>
          {(['fit', '50', '75', '100'] as PreviewZoom[]).map((zoom) => (
            <button
              key={zoom}
              type="button"
              className={previewZoom === zoom ? 'active' : ''}
              aria-pressed={previewZoom === zoom}
              aria-label={zoom === 'fit' ? es.toolbar.zoomFitLabel : `Zoom ${zoom} por ciento`}
              onClick={() => onPreviewZoomChange(zoom)}
            >
              {zoom === 'fit' ? es.toolbar.zoomFit : `${zoom}%`}
            </button>
          ))}
        </div>

        <button type="button" className="icon-button" title={es.toolbar.resetView} aria-label={es.toolbar.resetView} onClick={onResetView}>
          <RotateCcw size={17} aria-hidden />
        </button>
        <button
          type="button"
          className="icon-button"
          title={canvasOnly ? es.toolbar.showPanels : es.toolbar.canvasOnly}
          aria-label={canvasOnly ? es.toolbar.showPanels : es.toolbar.canvasOnly}
          aria-pressed={canvasOnly}
          onClick={onToggleCanvasOnly}
        >
          <Maximize2 size={17} aria-hidden />
        </button>
        {hasCompare ? (
          <button type="button" className="command-button" onClick={onClearCompare}>
            <Columns2 size={17} aria-hidden />
            <span>{es.toolbar.closeCompare}</span>
          </button>
        ) : null}
        <button type="button" className="command-button" onClick={onCopyHandoff}>
          <Copy size={17} aria-hidden />
          <span>{es.toolbar.copyHandoff}</span>
        </button>
        <button type="button" className="command-button primary" onClick={onExportHtml}>
          <Download size={17} aria-hidden />
          <span>{es.toolbar.exportHtml}</span>
        </button>
        <button type="button" className="command-button" onClick={onExportBundle}>
          <Download size={17} aria-hidden />
          <span>{es.toolbar.exportBundle}</span>
        </button>
      </div>
    </header>
  );
}
