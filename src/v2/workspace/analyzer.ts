import type { WorkspaceAnalysis, WorkspaceFile, WorkspaceSnapshot } from '../state/types';

type ReadFile = (path: string) => Promise<string>;

function has(files: WorkspaceFile[], pattern: RegExp): boolean {
  return files.some((file) => pattern.test(file.path));
}

function componentFiles(files: WorkspaceFile[]): WorkspaceFile[] {
  return files.filter((file) => /(^|\/)src\/components\/.+\.tsx$/i.test(file.path));
}

function extractCssVars(content: string): Record<string, string> {
  const colors: Record<string, string> = {};
  for (const match of content.matchAll(/--([a-z0-9-]*(?:color|bg|accent|surface|text)[a-z0-9-]*)\s*:\s*([^;]+);/gi)) {
    colors[match[1]] = match[2].trim();
  }
  return colors;
}

function extractFonts(content: string): string[] {
  const fonts = new Set<string>();
  for (const match of content.matchAll(/font-family\s*:\s*([^;]+);/gi)) {
    fonts.add(match[1].trim());
  }
  return [...fonts].slice(0, 8);
}

async function readFirst(files: WorkspaceFile[], test: RegExp, readFile: ReadFile): Promise<string> {
  const file = files.find((item) => test.test(item.path));
  if (!file) return '';
  try {
    return await readFile(file.path);
  } catch {
    return '';
  }
}

export async function analyzeWorkspace(files: WorkspaceFile[], readFile: ReadFile): Promise<WorkspaceAnalysis> {
  const packageJson = await readFirst(files, /(^|\/)package\.json$/i, readFile);
  const css = await readFirst(files, /\.(css|scss)$/i, readFile);
  const hasTailwind = /tailwindcss|tailwind\.config/i.test(packageJson) || has(files, /tailwind\.config\./i);
  const hasStyledComponents = /styled-components/i.test(packageJson);
  const hasCssModules = has(files, /\.module\.(css|scss)$/i);
  const components = componentFiles(files);

  const framework = has(files, /next\.config\./i)
    ? 'next'
    : has(files, /svelte\.config\./i)
      ? 'sveltekit'
      : /vite|@vitejs\/plugin-react/i.test(packageJson) || has(files, /vite\.config\./i)
        ? 'vite-react'
        : 'unknown';

  const styling = hasTailwind
    ? 'tailwind'
    : hasStyledComponents
      ? 'styled-components'
      : hasCssModules
        ? 'css-modules'
        : 'plain';

  const colors = extractCssVars(css);
  const fonts = extractFonts(css);

  return {
    framework,
    styling,
    designSystemFound: has(files, /(^|\/)(design-system|tokens|DESIGN\.md)/i) || Object.keys(colors).length > 0,
    tokens: Object.keys(colors).length || fonts.length ? { colors, fonts } : undefined,
    componentCount: components.length,
    topComponents: components.slice(0, 12).map((file) => file.path),
    hasDesignMd: has(files, /(^|\/)DESIGN\.md$/i),
  };
}

export function summarizeWorkspace(snapshot: WorkspaceSnapshot): string {
  const analysis = snapshot.analysis;
  if (!analysis) {
    return `${snapshot.stats.fileCount} files indexed.`;
  }

  return [
    `Framework: ${analysis.framework}`,
    `Styling: ${analysis.styling}`,
    `Design system: ${analysis.designSystemFound ? 'found' : 'not found'}`,
    `Components: ${analysis.componentCount}`,
    `Has DESIGN.md: ${analysis.hasDesignMd ? 'yes' : 'no'}`,
    analysis.topComponents.length ? `Top components:\n${analysis.topComponents.map((item) => `- ${item}`).join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
