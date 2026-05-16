import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../../src/design-system/tokens/contrast';
import { buildGeneratedArtifact, generatedArtifactCases } from '../helpers/generatedArtifacts';

type CssVars = Record<string, string>;

interface ContrastPair {
  label: string;
  foreground: string;
  background: string;
}

const textSelectors = [
  { selector: 'body', label: 'body text', foreground: '--ink', background: '--paper' },
  { selector: '.artifact-shell', label: 'artifact shell text', foreground: '--ink', background: '--paper' },
  { selector: '.eyebrow', label: 'eyebrow accent text', foreground: '--accent', background: '--paper' },
  { selector: '.primary-action', label: 'primary action text', foreground: '--paper', background: '--ink' },
  { selector: '.focus-card', label: 'focus card text', foreground: '--paper', background: '--ink' },
  { selector: '.mark', label: 'navigation mark text', foreground: '--paper', background: '--ink' },
] as const;

function parseCssVars(html: string): CssVars {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const style = Array.from(doc.querySelectorAll('style'))
    .map((node) => node.textContent ?? '')
    .join('\n');
  const rootBlock = style.match(/:root\s*\{(?<block>[\s\S]*?)\}/)?.groups?.block ?? '';
  const scheme = doc.body.dataset.scheme;
  const schemeBlock =
    scheme === 'contrast'
      ? (style.match(/body\[data-scheme="contrast"\]\s*\{(?<block>[\s\S]*?)\}/)?.groups?.block ?? '')
      : '';

  return Object.fromEntries(
    Array.from(`${rootBlock}\n${schemeBlock}`.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-f]{3,6})\s*;/gi)).map((match) => [
      match[1],
      match[2],
    ]),
  );
}

function requireVar(vars: CssVars, name: string): string {
  const value = vars[name];

  if (!value) {
    throw new Error(`Missing CSS variable ${name} in generated output`);
  }

  return value;
}

function contrastPairsFor(html: string): ContrastPair[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const vars = parseCssVars(html);

  return textSelectors
    .filter(({ selector }) => doc.querySelector(selector))
    .map(({ label, foreground, background }) => ({
      label,
      foreground: requireVar(vars, foreground),
      background: requireVar(vars, background),
    }));
}

function labelsInput(input: HTMLInputElement, doc: Document): boolean {
  if (input.labels && input.labels.length > 0) return true;
  if (input.getAttribute('aria-label')) return true;

  const labelledBy = input.getAttribute('aria-labelledby');
  return Boolean(labelledBy && doc.getElementById(labelledBy));
}

describe('generated HTML quality gates', () => {
  it.each(generatedArtifactCases)('keeps WCAG text contrast at 4.5:1 or better for $name', (testCase) => {
    const output = buildGeneratedArtifact(testCase);
    const failures = contrastPairsFor(output.html)
      .map((pair) => ({
        ...pair,
        ratio: contrastRatio(pair.foreground, pair.background),
      }))
      .filter((pair) => pair.ratio < 4.5);

    expect(failures).toEqual([]);
  });

  it.each(generatedArtifactCases)('emits required structural a11y for $name', (testCase) => {
    const output = buildGeneratedArtifact(testCase);
    const doc = new DOMParser().parseFromString(output.html, 'text/html');
    const imagesWithoutAlt = Array.from(doc.querySelectorAll('img')).filter((img) => !img.hasAttribute('alt'));
    const inputsWithoutLabels = Array.from(doc.querySelectorAll('input')).filter((input) => !labelsInput(input, doc));

    expect(doc.querySelector('main')).toBeTruthy();
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(inputsWithoutLabels).toEqual([]);
    expect(imagesWithoutAlt).toEqual([]);
  });
});
