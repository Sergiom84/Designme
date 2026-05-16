import { FileCode2, Gauge, Palette, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SideTab, SideTabOption } from '../types/app';

const sideTabs: SideTabOption[] = [
  { id: 'directions', label: 'Direcciones', icon: Palette },
  { id: 'tweaks', label: 'Tweaks', icon: SlidersHorizontal },
  { id: 'critique', label: 'Crítica', icon: Gauge },
  { id: 'handoff', label: 'Handoff', icon: FileCode2 },
];

interface InspectorPanelProps {
  sideTab: SideTab;
  onSideTabChange(tab: SideTab): void;
  children: ReactNode;
}

export function InspectorPanel({ sideTab, onSideTabChange, children }: InspectorPanelProps) {
  return (
    <aside className="right-panel">
      <nav className="tab-row" role="tablist" aria-label="Panel inspector">
        {sideTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              title={tab.label}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={sideTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={sideTab === tab.id ? 'active' : ''}
              onClick={() => onSideTabChange(tab.id)}
            >
              <Icon size={17} aria-hidden />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      {children}
    </aside>
  );
}
