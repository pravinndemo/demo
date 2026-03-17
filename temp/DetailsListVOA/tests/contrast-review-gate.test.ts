import { createTheme } from '@fluentui/react';
import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '').trim();
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const value = parseInt(expanded, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function srgbChannelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function contrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  const luminance = ({ r, g, b }: { r: number; g: number; b: number }) =>
    (0.2126 * srgbChannelToLinear(r))
    + (0.7152 * srgbChannelToLinear(g))
    + (0.0722 * srgbChannelToLinear(b));
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

describe('contrast review gate', () => {
  const gridSource = readRepoFile('DetailsListVOA/Grid.tsx');
  const cssSource = readRepoFile('DetailsListVOA/css/DetailsListVOA.css');

  test('uses a focus outline color that passes the 3:1 non-text contrast requirement on white', () => {
    expect(cssSource).not.toContain('#ffbf47');
    expect(cssSource).toContain('outline: 2px solid #1d70b8;');
    expect(contrastRatio('#1d70b8', '#ffffff')).toBeGreaterThanOrEqual(3);
  });

  test('keeps unavailable controls above contrast thresholds', () => {
    expect(cssSource).toContain('border-color: #737b84;');
    expect(cssSource).toContain('color: #5d656e;');
    expect(contrastRatio('#737b84', '#f3f2f1')).toBeGreaterThanOrEqual(3);
    expect(contrastRatio('#5d656e', '#f3f2f1')).toBeGreaterThanOrEqual(4.5);
  });

  test('uses a visible border color for custom button boundaries on white backgrounds', () => {
    const customButtonBorders = cssSource.match(/border: 1px solid #737b84;/g) ?? [];
    expect(customButtonBorders.length).toBeGreaterThanOrEqual(2);
    expect(contrastRatio('#737b84', '#ffffff')).toBeGreaterThanOrEqual(3);
  });

  test('uses a warning accent border that passes 3:1 against its background', () => {
    expect(cssSource).toContain('border-left: 4px solid #bc5f2c;');
    expect(contrastRatio('#bc5f2c', '#fff4ef')).toBeGreaterThanOrEqual(3);
  });

  test('uses an input-border token for pagination controls so button boundaries stay visible', () => {
    expect(gridSource).toContain('borderColor: theme.semanticColors.inputBorder');
    const theme = createTheme({
      palette: {
        themePrimary: '#3B79B7',
      },
      fonts: {
        medium: {
          fontFamily: "'Segoe UI', 'SegoeUI', 'Arial', sans-serif",
          fontSize: '14px',
        },
      },
    });
    expect(contrastRatio(theme.semanticColors.inputBorder, '#ffffff')).toBeGreaterThanOrEqual(3);
  });

  test('placeholder text token stays above the 4.5:1 text contrast threshold on white', () => {
    const theme = createTheme({
      palette: {
        themePrimary: '#3B79B7',
      },
      fonts: {
        medium: {
          fontFamily: "'Segoe UI', 'SegoeUI', 'Arial', sans-serif",
          fontSize: '14px',
        },
      },
    });
    expect(contrastRatio(theme.semanticColors.inputPlaceholderText, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
});
