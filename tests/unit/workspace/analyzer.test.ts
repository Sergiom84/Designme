import { describe, expect, it } from 'vitest';
import { analyzeWorkspace, summarizeWorkspace } from '../../../src/v2/workspace/analyzer';
import type { WorkspaceFile } from '../../../src/v2/state/types';

describe('workspace analyzer', () => {
  it('detects Vite React, CSS vars, and components', async () => {
    const files: WorkspaceFile[] = [
      { path: 'package.json', size: 100 },
      { path: 'vite.config.ts', size: 100 },
      { path: 'src/components/Button.tsx', size: 100 },
      { path: 'src/styles.css', size: 100 },
    ];
    const contents: Record<string, string> = {
      'package.json': '{"dependencies":{"@vitejs/plugin-react":"latest"}}',
      'src/styles.css': ':root { --color-accent: #2ec4b6; font-family: Inter, sans-serif; }',
    };

    const analysis = await analyzeWorkspace(files, async (path) => contents[path] ?? '');

    expect(analysis.framework).toBe('vite-react');
    expect(analysis.styling).toBe('plain');
    expect(analysis.designSystemFound).toBe(true);
    expect(analysis.componentCount).toBe(1);
    expect(summarizeWorkspace({ files, stats: { fileCount: files.length, bytes: 400 }, analysis })).toContain(
      'Framework: vite-react',
    );
  });
});
