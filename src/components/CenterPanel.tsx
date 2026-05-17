import type { ReactNode } from 'react';
import { CanvasToolbar } from './CanvasToolbar';
import { PreviewStage } from './PreviewStage';
import { StatusRow } from './StatusRow';
import type { PreviewComment, PreviewCommentTarget } from '../comments';
import type { DesignOutput } from '../engine/index';
import type { PreviewMode, PreviewZoom } from '../types/app';

interface CenterPanelProps {
  output: DesignOutput;
  compareOutput?: DesignOutput;
  previewMode: PreviewMode;
  previewZoom: PreviewZoom;
  zoomScale: number;
  canvasOnly: boolean;
  commentMode: boolean;
  commentCount: number;
  comments: PreviewComment[];
  status: string;
  exportPath: string;
  providerPicker?: ReactNode;
  agentStream?: ReactNode;
  onPreviewModeChange(mode: PreviewMode): void;
  onPreviewZoomChange(zoom: PreviewZoom): void;
  onToggleCanvasOnly(): void;
  onToggleCommentMode(): void;
  onCreatePreviewComment(target: PreviewCommentTarget, note: string): void;
  onResolvePreviewComment(commentId: string): void;
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
  commentMode,
  commentCount,
  comments,
  status,
  exportPath,
  providerPicker,
  agentStream,
  onPreviewModeChange,
  onPreviewZoomChange,
  onToggleCanvasOnly,
  onToggleCommentMode,
  onCreatePreviewComment,
  onResolvePreviewComment,
  onClearCompare,
  onResetView,
  onCopyHandoff,
  onExportHtml,
  onExportBundle,
}: CenterPanelProps) {
  return (
    <main className={agentStream ? 'center-panel has-agent-stream' : 'center-panel'}>
      <CanvasToolbar
        title={output.name}
        summary={output.briefSummary}
        previewMode={previewMode}
        previewZoom={previewZoom}
        canvasOnly={canvasOnly}
        hasCompare={Boolean(compareOutput)}
        commentMode={commentMode}
        commentCount={commentCount}
        providerPicker={providerPicker}
        onPreviewModeChange={onPreviewModeChange}
        onPreviewZoomChange={onPreviewZoomChange}
        onToggleCanvasOnly={onToggleCanvasOnly}
        onToggleCommentMode={onToggleCommentMode}
        onClearCompare={onClearCompare}
        onResetView={onResetView}
        onCopyHandoff={onCopyHandoff}
        onExportHtml={onExportHtml}
        onExportBundle={onExportBundle}
      />
      {agentStream}
      <PreviewStage
        previewMode={previewMode}
        html={output.html}
        compareHtml={compareOutput?.html}
        compareName={compareOutput?.name}
        zoomScale={zoomScale}
        commentMode={commentMode}
        comments={comments}
        onCreateComment={onCreatePreviewComment}
        onResolveComment={onResolvePreviewComment}
      />
      <StatusRow status={status} exportPath={exportPath} />
    </main>
  );
}
