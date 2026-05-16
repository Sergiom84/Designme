import { CanvasToolbar } from './CanvasToolbar';
import { PreviewStage } from './PreviewStage';
import { StatusRow } from './StatusRow';
import type { DesignOutput } from '../engine';
import type { PreviewMode, PreviewZoom } from '../types/app';

interface CenterPanelProps {
  output: DesignOutput;
  compareOutput?: DesignOutput;
  previewMode: PreviewMode;
  previewZoom: PreviewZoom;
  zoomScale: number;
  canvasOnly: boolean;
  status: string;
  exportPath: string;
  onPreviewModeChange(mode: PreviewMode): void;
  onPreviewZoomChange(zoom: PreviewZoom): void;
  onToggleCanvasOnly(): void;
  onClearCompare(): void;
  onResetView(): void;
  onCopyHandoff(): void;
  onExportHtml(): void;
  onExportBundle(): void;
}

export function CenterPanel({
  output,
  compareOutput,
  previewMode,
  previewZoom,
  zoomScale,
  canvasOnly,
  status,
  exportPath,
  onPreviewModeChange,
  onPreviewZoomChange,
  onToggleCanvasOnly,
  onClearCompare,
  onResetView,
  onCopyHandoff,
  onExportHtml,
  onExportBundle,
}: CenterPanelProps) {
  return (
    <main className="center-panel">
      <CanvasToolbar
        title={output.name}
        summary={output.briefSummary}
        previewMode={previewMode}
        previewZoom={previewZoom}
        canvasOnly={canvasOnly}
        hasCompare={Boolean(compareOutput)}
        onPreviewModeChange={onPreviewModeChange}
        onPreviewZoomChange={onPreviewZoomChange}
        onToggleCanvasOnly={onToggleCanvasOnly}
        onClearCompare={onClearCompare}
        onResetView={onResetView}
        onCopyHandoff={onCopyHandoff}
        onExportHtml={onExportHtml}
        onExportBundle={onExportBundle}
      />
      <PreviewStage
        previewMode={previewMode}
        html={output.html}
        compareHtml={compareOutput?.html}
        compareName={compareOutput?.name}
        zoomScale={zoomScale}
      />
      <StatusRow status={status} exportPath={exportPath} />
    </main>
  );
}
