import { ClipboardCheck, Copy } from 'lucide-react';
import type { Critique } from '../../engine/index';
import { es } from '../../i18n';
import type { QualityIssue, Severity } from '../../quality';

interface CritiqueInspectorProps {
  critique: Critique;
  onCopyCritique(): void;
}

export function CritiqueInspector({ critique, onCopyCritique }: CritiqueInspectorProps) {
  return (
    <section id="panel-critique" role="tabpanel" aria-labelledby="tab-critique" className="inspector-section" tabIndex={0}>
      <div className="score-lockup">
        <ClipboardCheck size={22} aria-hidden />
        <strong>{critique.total}/10</strong>
        <span>{es.inspector.critique.expertPass}</span>
      </div>
      <div className="score-list">
        {critique.scores.map((score) => (
          <div key={score.label}>
            <span>{score.label}</span>
            <meter min="0" max="10" value={score.value} aria-label={`${score.label}: ${score.value} de 10`} />
            <strong>{score.value}</strong>
          </div>
        ))}
      </div>
      <div className="issue-summary">
        <strong>{critique.issues.length}</strong>
        <span>{es.inspector.critique.issuesDetected}</span>
        <button type="button" className="command-button" onClick={onCopyCritique}>
          <Copy size={16} aria-hidden />
          <span>{es.inspector.critique.copy}</span>
        </button>
      </div>
      <QualityIssueList issues={critique.issues} />
      <CritiqueBlock title={es.inspector.critique.keep} items={critique.keep} />
      <CritiqueBlock title={es.inspector.critique.fix} items={critique.fix} />
      <CritiqueBlock title={es.inspector.critique.quickWins} items={critique.quickWins} />
    </section>
  );
}

function CritiqueBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="critique-block">
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const severityLabels: Record<Severity, string> = {
  error: es.inspector.critique.severity.error,
  warning: es.inspector.critique.severity.warning,
  info: es.inspector.critique.severity.info,
};

function QualityIssueList({ issues }: { issues: QualityIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="issue-empty">
        <strong>{es.inspector.critique.noBlockingIssues}</strong>
        <span>{es.inspector.critique.noBlockingIssuesDetail}</span>
      </div>
    );
  }

  return (
    <div className="issue-list">
      {issues.slice(0, 8).map((issue) => (
        <article key={issue.id} className={`issue-card ${issue.severity}`}>
          <div>
            <span>{severityLabels[issue.severity]}</span>
            <small>{issue.category}</small>
          </div>
          <strong>{issue.title}</strong>
          <p>{issue.detail}</p>
          <em>{issue.suggestedFix}</em>
        </article>
      ))}
    </div>
  );
}
