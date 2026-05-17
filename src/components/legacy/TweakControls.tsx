import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { defaultTweaks, type Density, type DesignTweaks, type Motion, type Tone } from '../../engine/index';
import { es } from '../../i18n';

interface TweakControlsProps {
  tweaks: DesignTweaks;
  onPatch(patch: Partial<DesignTweaks>): void;
  onReset(tweaks: DesignTweaks): void;
}

export function TweakControls({ tweaks, onPatch, onReset }: TweakControlsProps) {
  return (
    <section id="panel-tweaks" role="tabpanel" aria-labelledby="tab-tweaks" className="inspector-section" tabIndex={0}>
      <div className="section-heading">
        <SlidersHorizontal size={18} aria-hidden />
        <div>
          <strong>{es.inspector.tweaks.title}</strong>
          <span>{es.inspector.tweaks.subtitle}</span>
        </div>
      </div>

      <TweakSegment<Density>
        label={es.inspector.tweaks.density}
        value={tweaks.density}
        options={['calm', 'balanced', 'dense']}
        onChange={(density) => onPatch({ density })}
      />
      <TweakSegment<Tone>
        label={es.inspector.tweaks.tone}
        value={tweaks.tone}
        options={['light', 'contrast', 'ink']}
        onChange={(tone) => onPatch({ tone })}
      />
      <TweakSegment<Motion>
        label={es.inspector.tweaks.motion}
        value={tweaks.motion}
        options={['still', 'measured', 'expressive']}
        onChange={(motion) => onPatch({ motion })}
      />

      <label className="range-control">
        <span id="radius-label">{es.inspector.tweaks.radius} {tweaks.radius}px</span>
        <input
          type="range"
          min="0"
          max="12"
          step="1"
          value={tweaks.radius}
          aria-labelledby="radius-label"
          onChange={(event) => onPatch({ radius: Number(event.target.value) })}
        />
      </label>

      <label className="check-control">
        <input
          type="checkbox"
          checked={tweaks.showDevice}
          onChange={(event) => onPatch({ showDevice: event.target.checked })}
        />
        <span>{es.inspector.tweaks.showDevice}</span>
      </label>

      <button type="button" className="command-button" onClick={() => onReset(defaultTweaks)}>
        <RotateCcw size={17} aria-hidden />
        <span>{es.inspector.tweaks.reset}</span>
      </button>
    </section>
  );
}

interface TweakSegmentProps<T extends string> {
  label: string;
  value: T;
  options: T[];
  onChange(value: T): void;
}

function TweakSegment<T extends string>({ label, value, options, onChange }: TweakSegmentProps<T>) {
  const labels = es.inspector.tweaks.options as Record<string, string>;

  return (
    <div className="tweak-group">
      <span id={`tweak-${label.toLowerCase()}-label`}>{label}</span>
      <div className="segmented-control" role="group" aria-labelledby={`tweak-${label.toLowerCase()}-label`}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? 'active' : ''}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {labels[option] ?? option}
          </button>
        ))}
      </div>
    </div>
  );
}
