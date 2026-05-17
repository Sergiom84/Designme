import { describe, expect, it } from 'vitest';
import { contrastRatio, passesContrast, relativeLuminance } from '../../../src/design-system/tokens/contrast';

describe('contrast tokens', () => {
  it('calculates luminance for black and white', () => {
    expect(relativeLuminance('#000')).toBe(0);
    expect(relativeLuminance('#fff')).toBe(1);
  });

  it('calculates WCAG contrast ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5);
  });

  it('checks contrast thresholds for normal text', () => {
    expect(passesContrast('#191b1f', '#fffdf8')).toBe(true);
    expect(passesContrast('#aaaaaa', '#ffffff')).toBe(false);
  });
});
