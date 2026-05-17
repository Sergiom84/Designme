import type { DesignOutput } from '../engine/index';

export function buildStandaloneHtml(output: DesignOutput): string {
  return output.html;
}
