import { useCallback, useState } from 'react';
import type { DesignOutput } from '../engine/index';
import { buildExportBundle, type ExportBundleBuildInput } from '../export';
import { writeClipboard } from '../utils/clipboard';

interface UseExportActionsOptions {
  getOutput(): DesignOutput;
  getBundleInput(): ExportBundleBuildInput;
  onStatus(message: string): void;
}

interface UseExportActionsResult {
  exportPath: string;
  copyHandoff(): Promise<void>;
  copyCritique(): Promise<void>;
  exportHtml(): Promise<void>;
  exportBundle(): Promise<void>;
  openExports(): Promise<void>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}

/**
 * Centralises every "what happens when the user clicks copy/export/open"
 * action. The hook owns the resolved `exportPath` for the latest desktop
 * export but reports status messages back to the caller via `onStatus` so the
 * App component keeps a single status row driving the UI.
 */
export function useExportActions({
  getOutput,
  getBundleInput,
  onStatus,
}: UseExportActionsOptions): UseExportActionsResult {
  const [exportPath, setExportPath] = useState('');

  const copyHandoff = useCallback(async () => {
    const copied = await writeClipboard(getOutput().handoffPrompt);
    onStatus(copied ? 'Handoff copiado' : 'No se pudo acceder al portapapeles');
  }, [getOutput, onStatus]);

  const copyCritique = useCallback(async () => {
    const output = getOutput();
    const lines = [
      `Puntuación de calidad: ${output.critique.total}/10`,
      '',
      'Puntuaciones:',
      ...output.critique.scores.map((score) => `- ${score.label}: ${score.value}/10`),
      '',
      'Incidencias:',
      ...output.critique.issues.map((issue) => `- [${issue.severity}] ${issue.title}: ${issue.suggestedFix}`),
      '',
      'Corregir:',
      ...output.critique.fix.map((item) => `- ${item}`),
    ];
    const copied = await writeClipboard(lines.join('\n'));
    onStatus(copied ? 'Crítica copiada' : 'No se pudo acceder al portapapeles');
  }, [getOutput, onStatus]);

  const exportHtml = useCallback(async () => {
    try {
      const output = getOutput();
      if (window.designme) {
        const result = await window.designme.exportHtml({ name: output.exportName, html: output.html });
        setExportPath(result.filePath);
        onStatus('HTML exportado');
        return;
      }

      const blob = new Blob([output.html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${output.exportName}.html`;
      link.click();
      URL.revokeObjectURL(url);
      onStatus('HTML descargado');
    } catch (error) {
      onStatus(`No se pudo exportar HTML: ${errorMessage(error)}`);
    }
  }, [getOutput, onStatus]);

  const exportBundle = useCallback(async () => {
    try {
      const bundle = buildExportBundle(getBundleInput());

      if (window.designme) {
        const result = await window.designme.exportBundle({ name: bundle.name, files: bundle.files });
        setExportPath(result.filePath);
        onStatus('Paquete exportado');
        return;
      }

      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bundle.name}-bundle.json`;
      link.click();
      URL.revokeObjectURL(url);
      onStatus('Paquete descargado como JSON');
    } catch (error) {
      onStatus(`No se pudo exportar el paquete: ${errorMessage(error)}`);
    }
  }, [getBundleInput, onStatus]);

  const openExports = useCallback(async () => {
    try {
      if (!window.designme) {
        onStatus('La carpeta de exportaciones está disponible en modo escritorio');
        return;
      }
      const result = await window.designme.openExports();
      onStatus(`Carpeta abierta: ${result.directory}`);
    } catch (error) {
      onStatus(`No se pudo abrir exports: ${errorMessage(error)}`);
    }
  }, [onStatus]);

  return { exportPath, copyHandoff, copyCritique, exportHtml, exportBundle, openExports };
}
