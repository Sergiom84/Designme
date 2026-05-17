import { Maximize2, Trash2, Wand2 } from 'lucide-react';
import type { Idea } from '../state/types';

interface CenterDashboardProps {
  ideas: Idea[];
  activeIdeaId?: string;
  onSelectIdea(id: string): void;
  onGenerate(): void;
  onDeleteIdea(id: string): void;
}

export function CenterDashboard({ ideas, activeIdeaId, onSelectIdea, onGenerate, onDeleteIdea }: CenterDashboardProps) {
  const activeIdea = ideas.find((idea) => idea.id === activeIdeaId);

  if (ideas.length === 0) {
    return (
      <div className="v2-empty-dashboard">
        <h1>Describe, pregunta, genera variantes.</h1>
        <p>Chat a la izquierda. Ideas en el centro. Tweaks, critique y workspace a la derecha.</p>
        <button className="v2-primary-button" type="button" onClick={onGenerate}>
          <Wand2 size={16} />
          Generate 3 ideas
        </button>
      </div>
    );
  }

  if (activeIdea) {
    return (
      <div className="v2-focus">
        <div className="v2-focus__stage">
          <div className="v2-focus__header">
            <div>
              <span>{activeIdea.status}</span>
              <h2>{activeIdea.title}</h2>
            </div>
            <button className="v2-secondary-button" type="button" onClick={onGenerate}>
              <Wand2 size={16} />
              Regenerate
            </button>
          </div>
          {activeIdea.html ? (
            <iframe className="v2-preview-frame" title={activeIdea.title} sandbox="" srcDoc={activeIdea.html} />
          ) : (
            <div className="v2-preview-placeholder">Esperando HTML...</div>
          )}
        </div>
        <div className="v2-focus__strip" aria-label="Otras ideas">
          {ideas.map((idea) => (
            <button
              key={idea.id}
              className={`v2-strip-card ${idea.id === activeIdea.id ? 'is-active' : ''}`}
              type="button"
              onClick={() => onSelectIdea(idea.id)}
            >
              <span>{idea.title}</span>
              <small>{idea.status}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="v2-idea-grid">
      {ideas.map((idea) => (
        <article key={idea.id} className="v2-idea-card">
          <header>
            <div>
              <span>{idea.status}</span>
              <h2>{idea.title}</h2>
            </div>
            <button className="v2-icon-button" type="button" title="Delete idea" onClick={() => onDeleteIdea(idea.id)}>
              <Trash2 size={16} />
            </button>
          </header>
          <button className="v2-card-preview" type="button" onClick={() => onSelectIdea(idea.id)}>
            {idea.html ? (
              <iframe title={`${idea.title} thumbnail`} sandbox="" srcDoc={idea.html} />
            ) : (
              <span>Streaming...</span>
            )}
          </button>
          <footer>
            <button className="v2-secondary-button" type="button" onClick={() => onSelectIdea(idea.id)}>
              <Maximize2 size={16} />
              Expand
            </button>
          </footer>
        </article>
      ))}
    </div>
  );
}
