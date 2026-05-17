import type { ReactNode } from 'react';
import { classNames } from '../utils/classNames';

interface AppShellProps {
  canvasOnly: boolean;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export function AppShell({ canvasOnly, left, center, right }: AppShellProps) {
  return (
    <div className={classNames('app-shell', canvasOnly && 'canvas-only')}>
      {left}
      {center}
      {right}
    </div>
  );
}
