import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onSave(): void;
  onExport(): void;
  onCanvasOnly(): void;
  onResetPreview(): void;
}

export function useKeyboardShortcuts({
  onSave,
  onExport,
  onCanvasOnly,
  onResetPreview,
}: KeyboardShortcutHandlers): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;

      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        onSave();
      }
      if (key === 'e') {
        event.preventDefault();
        onExport();
      }
      if (key === 'b') {
        event.preventDefault();
        onCanvasOnly();
      }
      if (key === '0') {
        event.preventDefault();
        onResetPreview();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCanvasOnly, onExport, onResetPreview, onSave]);
}
