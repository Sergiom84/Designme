function expandHex(hex: string): string {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return clean
      .split('')
      .map((char) => char + char)
      .join('');
  }
  return clean.slice(0, 6);
}

function channelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const value = expandHex(hex);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return 0.2126 * channelToLinear(red) + 0.7152 * channelToLinear(green) + 0.0722 * channelToLinear(blue);
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function passesContrast(foreground: string, background: string, threshold = 4.5): boolean {
  return contrastRatio(foreground, background) >= threshold;
}
