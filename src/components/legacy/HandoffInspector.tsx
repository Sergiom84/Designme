import { Copy, FileCode2, FolderOpen } from 'lucide-react';
import { es } from '../../i18n';

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
          <strong>{es.inspector.handoff.title}</strong>
          <span>{es.inspector.handoff.subtitle}</span>
        </div>
      </div>
      <label className="sr-only" htmlFor="handoff-prompt">{es.inspector.handoff.promptLabel}</label>
      <textarea id="handoff-prompt" readOnly value={handoffPrompt} />
      <div className="handoff-actions">
        <button type="button" className="command-button" onClick={onCopyHandoff}>
          <Copy size={17} aria-hidden />
          <span>{es.inspector.handoff.copy}</span>
        </button>
        <button type="button" className="command-button" onClick={onOpenExports}>
          <FolderOpen size={17} aria-hidden />
          <span>{es.inspector.handoff.openExports}</span>
        </button>
      </div>
    </section>
  );
}
