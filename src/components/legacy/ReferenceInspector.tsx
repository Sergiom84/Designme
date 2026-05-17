import { Image, Wand2 } from 'lucide-react';
import { es } from '../../i18n';
import type { ReferenceAnalysis, StoredReferenceState } from '../../references';

interface ReferenceInspectorProps {
  referenceState: StoredReferenceState;
  analysis: ReferenceAnalysis;
  onNotesChange(notes: string): void;
  onApplyPreferences(): void;
  onEnhancePrompt(): void;
}

export function ReferenceInspector({
  referenceState,
  analysis,
  onNotesChange,
  onApplyPreferences,
  onEnhancePrompt,
}: ReferenceInspectorProps) {
  const hasReference = referenceState.notes.trim().length > 0;
  const canApply = hasReference && (analysis.preferences.directionId || Object.keys(analysis.preferences.tweaksPatch).length > 0);
  const canEnhance = hasReference && analysis.preferences.promptHints.length > 0;

  return (
    <section id="panel-references" role="tabpanel" aria-labelledby="tab-references" className="inspector-section reference-section" tabIndex={0}>
      <div className="section-heading">
        <Image size={18} aria-hidden />
        <div>
          <strong>{es.inspector.references.title}</strong>
          <span>{es.inspector.references.subtitle}</span>
        </div>
      </div>

      <label className="reference-field" htmlFor="reference-notes">
        <span>{es.inspector.references.notesLabel}</span>
        <textarea
          id="reference-notes"
          value={referenceState.notes}
          placeholder={es.inspector.references.placeholder}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </label>

      <div className="reference-summary">
        <strong>{analysis.summary}</strong>
        <span>{es.inspector.references.localOnly}</span>
      </div>

      {analysis.keywords.length > 0 ? (
        <div className="reference-tags" aria-label={es.inspector.references.detectedLabel}>
          {analysis.keywords.map((keyword) => (
            <span key={keyword}>{keyword}</span>
          ))}
        </div>
      ) : null}

      {analysis.preferences.visualNotes.length > 0 ? (
        <ul className="reference-notes-list">
          {analysis.preferences.visualNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <div className="reference-actions">
        <button type="button" className="command-button" onClick={onApplyPreferences} disabled={!canApply}>
          <Image size={16} aria-hidden />
          <span>{es.inspector.references.applyStyle}</span>
        </button>
        <button type="button" className="command-button primary" onClick={onEnhancePrompt} disabled={!canEnhance}>
          <Wand2 size={16} aria-hidden />
          <span>{es.inspector.references.enhancePrompt}</span>
        </button>
      </div>
    </section>
  );
}
