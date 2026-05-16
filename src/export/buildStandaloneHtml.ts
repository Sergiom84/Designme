import type { DesignOutput } from '../engine';

export function buildStandaloneHtml(output: DesignOutput): string {
  return output.html;
}
