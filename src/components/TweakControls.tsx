import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { defaultTweaks, type Density, type DesignTweaks, type Motion, type Tone } from '../engine';

interface TweakControlsProps {
  tweaks: DesignTweaks;
  onPatch(patch: Partial<DesignTweaks>): void;
  onReset(tweaks: DesignTweaks): void;
}

export function TweakControls({ tweaks, onPatch, onReset }: TweakControlsProps) {
  return (
    <section id="panel-tweaks" role="tabpanel" aria-labelledby="tab-tweaks" className="inspector-section">
      <div className="section-heading">
        <SlidersHorizontal size={18} aria-hidden />
        <div>
          <strong>Tweak surface</strong>
          <span>Controles pequeños, decisiones reales.</span>
        </div>
      </div>

      <TweakSegment<Density>
        label="Density"
        value={tweaks.density}
        options={['calm', 'balanced', 'dense']}
        onChange={(density) => onPatch({ density })}
      />
      <TweakSegment<Tone>
        label="Tone"
        value={tweaks.tone}
        options={['light', 'contrast', 'ink']}
        onChange={(tone) => onPatch({ tone })}
      />
      <TweakSegment<Motion>
        label="Motion"
        value={tweaks.motion}
        options={['still', 'measured', 'expressive']}
        onChange={(motion) => onPatch({ motion })}
      />

      <label className="range-control">
        <span>Radius {tweaks.radius}px</span>
        <input
          type="range"
          min="0"
          max="12"
          step="1"
          value={tweaks.radius}
          onChange={(event) => onPatch({ radius: Number(event.target.value) })}
        />
      </label>

      <label className="check-control">
        <input
          type="checkbox"
          checked={tweaks.showDevice}
          onChange={(event) => onPatch({ showDevice: event.target.checked })}
        />
        <span>Show device frame for mobile prototypes</span>
      </label>

      <button type="button" className="command-button" onClick={() => onReset(defaultTweaks)}>
        <RotateCcw size={17} aria-hidden />
        <span>Reset tweaks</span>
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
  return (
    <div className="tweak-group">
      <span>{label}</span>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? 'active' : ''}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
