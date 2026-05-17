import { CheckCircle2, Layers } from 'lucide-react';
import { getThemeById } from '../design-system/tokens';
import { designDirections, domainLabels, goalLabels, type DesignOutput, type DirectionId } from '../engine/index';
import { es } from '../i18n';
import { classNames } from '../utils/classNames';

interface DirectionInspectorProps {
  output: DesignOutput;
  directionId: DirectionId;
  onDirectionChange(directionId: DirectionId): void;
}

export function DirectionInspector({ output, directionId, onDirectionChange }: DirectionInspectorProps) {
  return (
    <section id="panel-directions" role="tabpanel" aria-labelledby="tab-directions" className="inspector-section" tabIndex={0}>
      <div className="section-heading">
        <Layers size={18} aria-hidden />
        <div>
          <strong>{es.inspector.directions.title}</strong>
          <span>{es.inspector.directions.subtitle}</span>
        </div>
      </div>
      <div className="intent-card">
        <div>
          <span>{es.inspector.directions.domain}</span>
          <strong>{domainLabels[output.intent.domain]}</strong>
        </div>
        <div>
          <span>{es.inspector.directions.uxGoal}</span>
          <strong>{goalLabels[output.intent.goal]}</strong>
        </div>
        <p>{output.intent.userMentalModel}</p>
        <ul>
          {output.intent.modules.slice(0, 4).map((module) => (
            <li key={module.id}>{module.label}</li>
          ))}
        </ul>
      </div>
      <div className="direction-list" role="group" aria-label={es.inspector.directions.visualDirectionsLabel}>
        {designDirections.map((direction) => {
          const theme = getThemeById(direction.themeId);
          return (
            <button
              key={direction.id}
              type="button"
              aria-pressed={directionId === direction.id}
              className={classNames('direction-card', directionId === direction.id && 'is-selected')}
              onClick={() => onDirectionChange(direction.id)}
            >
              <span className="swatches" aria-hidden>
                <i style={{ background: theme.color.accent }} />
                <i style={{ background: theme.color.secondary }} />
                <i style={{ background: theme.color.highlight }} />
              </span>
              <strong>{direction.name}</strong>
              <small>{direction.school}</small>
              <p>{direction.promise}</p>
            </button>
          );
        })}
      </div>
      <div className="assumption-list">
        {output.assumptions.map((assumption) => (
          <div key={assumption}>
            <CheckCircle2 size={16} aria-hidden />
            <span>{assumption}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
