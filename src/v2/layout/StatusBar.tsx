import type { RunState } from '../state/types';

interface StatusBarProps {
  state: RunState;
  text: string;
  ideaCount: number;
  tokenCount?: number;
}

export function StatusBar({ state, text, ideaCount, tokenCount = 0 }: StatusBarProps) {
  return (
    <footer className="v2-statusbar">
      <span className={`v2-status-dot is-${state}`} />
      <span>{text}</span>
      <span>{ideaCount} ideas</span>
      <span>{tokenCount} tokens</span>
    </footer>
  );
}
