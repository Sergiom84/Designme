import { Copy, FileCode2, FolderOpen } from 'lucide-react';

interface HandoffInspectorProps {
  handoffPrompt: string;
  onCopyHandoff(): void;
  onOpenExports(): void;
}

export function HandoffInspector({ handoffPrompt, onCopyHandoff, onOpenExports }: HandoffInspectorProps) {
  return (
    <section id="panel-handoff" role="tabpanel" aria-labelledby="tab-handoff" className="inspector-section handoff-section" tabIndex={0}>
      <div className="section-heading">
        <FileCode2 size={18} aria-hidden />
        <div>
          <strong>Agent handoff</strong>
          <span>Para Codex, Claude o cualquier agente que ya pagas.</span>
        </div>
      </div>
      <label className="sr-only" htmlFor="handoff-prompt">Prompt de handoff</label>
      <textarea id="handoff-prompt" readOnly value={handoffPrompt} />
      <div className="handoff-actions">
        <button type="button" className="command-button" onClick={onCopyHandoff}>
          <Copy size={17} aria-hidden />
          <span>Copy</span>
        </button>
        <button type="button" className="command-button" onClick={onOpenExports}>
          <FolderOpen size={17} aria-hidden />
          <span>Exports</span>
        </button>
      </div>
    </section>
  );
}
