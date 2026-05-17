import type { ReactNode } from 'react';
import '../v2.css';

interface ShellProps {
  topBar: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  status: ReactNode;
  theme: 'dark' | 'light';
}

export function Shell({ topBar, left, center, right, status, theme }: ShellProps) {
  return (
    <div className={`v2-shell v2-shell--${theme}`}>
      {topBar}
      <main className="v2-shell__grid" aria-label="Designme rediseño">
        <aside className="v2-shell__rail">{left}</aside>
        <section className="v2-shell__center">{center}</section>
        <aside className="v2-shell__inspector">{right}</aside>
      </main>
      {status}
    </div>
  );
}
