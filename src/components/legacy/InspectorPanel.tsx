import { FileCode2, Gauge, Image, Palette, SlidersHorizontal } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import type { SideTab, SideTabOption } from '../../types/app';
import { es } from '../../i18n';

const sideTabs: SideTabOption[] = [
  { id: 'directions', label: es.inspector.tabs.directions, icon: Palette },
  { id: 'tweaks', label: es.inspector.tabs.tweaks, icon: SlidersHorizontal },
  { id: 'references', label: es.inspector.tabs.references, icon: Image },
  { id: 'critique', label: es.inspector.tabs.critique, icon: Gauge },
  { id: 'handoff', label: es.inspector.tabs.handoff, icon: FileCode2 },
];

interface InspectorPanelProps {
  sideTab: SideTab;
  onSideTabChange(tab: SideTab): void;
  children: ReactNode;
}

export function InspectorPanel({ sideTab, onSideTabChange, children }: InspectorPanelProps) {
  function focusTab(tab: SideTab) {
    document.getElementById(`tab-${tab}`)?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = sideTabs.length - 1;
    let nextIndex = index;

    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
    if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = lastIndex;
    if (nextIndex === index && !['Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const nextTab = sideTabs[nextIndex].id;
    onSideTabChange(nextTab);
    window.requestAnimationFrame(() => focusTab(nextTab));
  }

  return (
    <aside className="right-panel">
      <nav className="tab-row" role="tablist" aria-label={es.inspector.tabsLabel} aria-orientation="horizontal">
        {sideTabs.map((tab, index) => {
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
              tabIndex={sideTab === tab.id ? 0 : -1}
              className={sideTab === tab.id ? 'active' : ''}
              onClick={() => onSideTabChange(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
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
