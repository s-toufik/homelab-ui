import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'src/styles/_themes.scss');
const catalog = resolve(root, 'src/app/shell/domain/theme-catalog.json');

const GEIST = "'Geist Sans', 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const GEIST_MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const ATKINSON = "'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, sans-serif";
const QUICKSAND = "'Quicksand', 'Geist Sans', -apple-system, sans-serif";
const FRAUNCES = "'Fraunces', Georgia, serif";
const CINZEL = "'Cinzel', 'Times New Roman', serif";
const FELL = "'IM Fell English', Georgia, serif";

const HUES = ['orange', 'teal', 'indigo', 'purple', 'blue', 'green', 'rose', 'amber', 'slate'];

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

function mix(color, other, weight) {
  const a = rgb(color);
  const b = rgb(other);
  const channel = (i) => Math.round(a[i] * weight + b[i] * (1 - weight));
  return `#${[0, 1, 2]
    .map((i) => channel(i).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

const HUE_COLORS = {
  dark: {
    orange: '#F0883E',
    teal: '#39C5BB',
    indigo: '#8C9EFF',
    purple: '#BC8CFF',
    blue: '#58A6FF',
    green: '#56D364',
    rose: '#F778BA',
    amber: '#E3B341',
    slate: '#A8B3C2',
  },
  light: {
    orange: '#B54708',
    teal: '#0B7D73',
    indigo: '#4F46E5',
    purple: '#7A45D6',
    blue: '#0B63CE',
    green: '#1A7F37',
    rose: '#BF3989',
    amber: '#8A6100',
    slate: '#4B5768',
  },
  contrast: {
    orange: '#8A3300',
    teal: '#005E56',
    indigo: '#2E2A9E',
    purple: '#5A2BA8',
    blue: '#0047A3',
    green: '#0F5A26',
    rose: '#8C1F5E',
    amber: '#6B4A00',
    slate: '#000000',
  },
};

const THEMES = [
  {
    id: 'navy',
    name: 'Navy',
    tagline: 'Deep blue, easy on the eyes',
    dark: true,
    hues: 'dark',
    fontSans: GEIST,
    surface: '#0A0F15',
    side: '#0D131B',
    raised: '#111923',
    hover: '#16212E',
    sunken: '#0C121A',
    text: '#E6EDF3',
    muted: '#8E9BAC',
    border: '#1F2B3A',
    accent: '#58A6FF',
    accentHover: '#79B8FF',
    onAccent: '#0A0F15',
    mono: '#79C0FF',
    success: '#3FB950',
    warning: '#D29922',
    danger: '#F85149',
    dangerSoft: '#2A1215',
    codeSurface: '#0C121A',
    codeText: '#A5D6FF',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -20px rgb(0 0 0 / 70%)',
    borderWidth: '1px',
  },
  {
    id: 'light',
    name: 'Light',
    tagline: 'The same layout, on white',
    dark: false,
    hues: 'light',
    fontSans: GEIST,
    surface: '#F4F6F9',
    side: '#EDF0F4',
    raised: '#FFFFFF',
    hover: '#E5EAF0',
    sunken: '#F7F9FB',
    text: '#1B2129',
    muted: '#566272',
    border: '#D6DCE4',
    accent: '#1F6FEB',
    accentHover: '#1A5FCC',
    onAccent: '#FFFFFF',
    mono: '#0B63CE',
    success: '#1A7F37',
    warning: '#9A6700',
    danger: '#C9271E',
    dangerSoft: '#FDECEB',
    codeSurface: '#F0F3F7',
    codeText: '#0B4FA6',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -24px rgb(27 33 41 / 35%)',
    borderWidth: '1px',
  },
  {
    id: 'contrast',
    name: 'Contrast',
    tagline: 'Black on white, largest and clearest',
    dark: false,
    hues: 'contrast',
    fontSans: ATKINSON,
    surface: '#FFFFFF',
    side: '#FFFFFF',
    raised: '#FFFFFF',
    hover: '#EEF0F3',
    sunken: '#FFFFFF',
    text: '#000000',
    muted: '#1F2937',
    border: '#000000',
    accent: '#0047A3',
    accentHover: '#003680',
    onAccent: '#FFFFFF',
    mono: '#0047A3',
    success: '#0F5A26',
    warning: '#6B4A00',
    danger: '#991B1B',
    dangerSoft: '#FFFFFF',
    codeSurface: '#FFFFFF',
    codeText: '#000000',
    shadowCard: 'none',
    shadowFloat: '0 0 0 2px #000000',
    borderWidth: '2px',
  },
  {
    id: 'blossom',
    name: 'Blossom',
    tagline: 'Soft pink, rounded letters',
    dark: false,
    hues: 'light',
    fontSans: QUICKSAND,
    fontHead: QUICKSAND,
    surface: '#FFF5F8',
    side: '#FCE9F0',
    raised: '#FFFFFF',
    hover: '#F9DDE7',
    sunken: '#FFF9FB',
    text: '#3A1828',
    muted: '#7A4B60',
    border: '#F1CFDC',
    accent: '#C2185B',
    accentHover: '#A3144C',
    onAccent: '#FFFFFF',
    mono: '#AD1457',
    success: '#2E7D4F',
    warning: '#8A5A00',
    danger: '#B3261E',
    dangerSoft: '#FDE7EA',
    codeSurface: '#FCEFF4',
    codeText: '#8E1350',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -24px rgb(58 24 40 / 35%)',
    borderWidth: '1px',
  },
  {
    id: 'lilac',
    name: 'Lilac',
    tagline: 'Lavender and violet, light and airy',
    dark: false,
    hues: 'light',
    fontSans: GEIST,
    fontHead: QUICKSAND,
    surface: '#F8F5FF',
    side: '#EFE9FB',
    raised: '#FFFFFF',
    hover: '#E7DFF8',
    sunken: '#FBF9FF',
    text: '#2B1F45',
    muted: '#645680',
    border: '#DDD3F2',
    accent: '#7445D6',
    accentHover: '#6338BF',
    onAccent: '#FFFFFF',
    mono: '#6338BF',
    success: '#2E7D4F',
    warning: '#8A5A00',
    danger: '#B3261E',
    dangerSoft: '#FCE8EC',
    codeSurface: '#F1ECFC',
    codeText: '#5B33B5',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -24px rgb(43 31 69 / 35%)',
    borderWidth: '1px',
  },
  {
    id: 'forest',
    name: 'Forest',
    tagline: 'Moss, bark and morning light',
    dark: false,
    hues: 'light',
    fontSans: GEIST,
    fontHead: FRAUNCES,
    surface: '#F3F5EE',
    side: '#E8EDE0',
    raised: '#FDFEFA',
    hover: '#DFE6D4',
    sunken: '#F7F9F3',
    text: '#1E2A1F',
    muted: '#526150',
    border: '#CED9C2',
    accent: '#2F6B3F',
    accentHover: '#275A35',
    onAccent: '#FFFFFF',
    mono: '#6B4F1D',
    success: '#2F6B3F',
    warning: '#7F530F',
    danger: '#A63A2A',
    dangerSoft: '#F6E5E0',
    codeSurface: '#E9EEE2',
    codeText: '#3D5A2A',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -24px rgb(30 42 31 / 35%)',
    borderWidth: '1px',
  },
  {
    id: 'dragon',
    name: 'Dragon Rider',
    tagline: 'Obsidian, ember and gold, after Fourth Wing',
    dark: true,
    hues: 'dark',
    fontSans: GEIST,
    fontHead: CINZEL,
    surface: '#0E0B0A',
    side: '#141010',
    raised: '#1A1413',
    hover: '#241B19',
    sunken: '#110D0C',
    text: '#F3E9DC',
    muted: '#B3A08E',
    border: '#3A2A24',
    accent: '#E8603F',
    accentHover: '#F2744F',
    onAccent: '#140A06',
    mono: '#E8B65A',
    success: '#7BC47F',
    warning: '#E8B65A',
    danger: '#FF6B57',
    dangerSoft: '#2C1210',
    codeSurface: '#120E0D',
    codeText: '#F0C674',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -20px rgb(0 0 0 / 75%)',
    borderWidth: '1px',
  },
  {
    id: 'wizarding',
    name: 'Wizarding',
    tagline: 'Burgundy, gold and parchment, after Harry Potter',
    dark: true,
    hues: 'dark',
    fontSans: GEIST,
    fontHead: FELL,
    surface: '#1A0F14',
    side: '#200F17',
    raised: '#26141C',
    hover: '#321B25',
    sunken: '#170D12',
    text: '#F4E8D0',
    muted: '#C2A98A',
    border: '#4A2A35',
    accent: '#D4A93A',
    accentHover: '#E6BD52',
    onAccent: '#1A0F14',
    mono: '#E6C67A',
    success: '#8FC98A',
    warning: '#E6BD52',
    danger: '#FF7A6B',
    dangerSoft: '#33141A',
    codeSurface: '#170D12',
    codeText: '#F0D58C',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -20px rgb(0 0 0 / 75%)',
    borderWidth: '1px',
  },
];

function hueSet(theme, hue) {
  const color = HUE_COLORS[theme.hues][hue];
  return {
    color,
    soft: mix(color, theme.raised, theme.dark ? 0.16 : 0.07),
  };
}

function block(theme) {
  const lines = [
    `--font-sans: ${theme.fontSans};`,
    `--font-head: ${theme.fontHead ?? theme.fontSans};`,
    `--font-mono: ${GEIST_MONO};`,
    `--surface: ${theme.surface};`,
    `--surface-side: ${theme.side};`,
    `--surface-raised: ${theme.raised};`,
    `--surface-hover: ${theme.hover};`,
    `--surface-sunken: ${theme.sunken};`,
    `--text: ${theme.text};`,
    `--text-muted: ${theme.muted};`,
    `--border: ${theme.border};`,
    `--border-width: ${theme.borderWidth};`,
    `--card-border: ${theme.borderWidth} solid ${theme.border};`,
    `--accent: ${theme.accent};`,
    `--accent-hover: ${theme.accentHover};`,
    `--on-accent: ${theme.onAccent};`,
    `--on-accent-soft: ${theme.accent};`,
    `--accent-soft: color-mix(in srgb, ${theme.accent} 14%, ${theme.raised});`,
    `--accent-border: color-mix(in srgb, ${theme.accent} 45%, transparent);`,
    `--mono: ${theme.mono};`,
    `--success: ${theme.success};`,
    `--warning: ${theme.warning};`,
    `--danger: ${theme.danger};`,
    `--danger-soft: ${theme.dangerSoft};`,
    `--code-surface: ${theme.codeSurface};`,
    `--code-text: ${theme.codeText};`,
    `--shadow-card: ${theme.shadowCard};`,
    `--shadow-float: ${theme.shadowFloat};`,
    `--backdrop-glow: none;`,
    `color-scheme: ${theme.dark ? 'dark' : 'light'};`,
  ];
  for (const hue of HUES) {
    const set = hueSet(theme, hue);
    lines.push(`--hue-${hue}: ${set.color};`, `--hue-${hue}-soft: ${set.soft};`);
  }
  ['blue', 'green', 'amber', 'purple', 'rose', 'teal', 'orange', 'indigo']
    .map((hue) => HUE_COLORS[theme.hues][hue])
    .forEach((color, index) => lines.push(`--chart-${index + 1}: ${color};`));
  return lines.map((line) => `  ${line}`).join('\n');
}

function checks(theme) {
  const pairs = [
    ['text', theme.text, 'surface', theme.surface],
    ['text', theme.text, 'raised', theme.raised],
    ['text', theme.text, 'side', theme.side],
    ['muted', theme.muted, 'surface', theme.surface],
    ['muted', theme.muted, 'raised', theme.raised],
    ['muted', theme.muted, 'side', theme.side],
    ['muted', theme.muted, 'hover', theme.hover],
    ['accent', theme.accent, 'raised', theme.raised],
    ['on-accent', theme.onAccent, 'accent', theme.accent],
    ['mono', theme.mono, 'raised', theme.raised],
    ['mono', theme.mono, 'surface', theme.surface],
    ['success', theme.success, 'raised', theme.raised],
    ['warning', theme.warning, 'raised', theme.raised],
    ['danger', theme.danger, 'raised', theme.raised],
    ['danger', theme.danger, 'danger-soft', theme.dangerSoft],
    ['code-text', theme.codeText, 'code-surface', theme.codeSurface],
  ];
  for (const hue of HUES) {
    const set = hueSet(theme, hue);
    pairs.push(
      [hue, set.color, 'raised', theme.raised],
      [hue, set.color, 'surface', theme.surface],
      [hue, set.color, `${hue}-soft`, set.soft],
    );
  }
  return pairs
    .map(([fg, fgValue, bg, bgValue]) => ({ fg, bg, ratio: contrast(fgValue, bgValue) }))
    .filter((pair) => pair.ratio < 4.5)
    .map((pair) => `${theme.id}: ${pair.fg} on ${pair.bg} = ${pair.ratio.toFixed(2)}`);
}

const failures = THEMES.flatMap(checks);
if (failures.length) {
  console.error(`Text below 4.5:1:\n${failures.join('\n')}`);
  process.exit(1);
}

const light = THEMES.find((theme) => theme.id === 'light');
const navy = THEMES.find((theme) => theme.id === 'navy');
const scss = [
  '// Generated by scripts/themes.mjs (npm run themes). Edit the script, not this file.',
  '',
  `:root,\n[data-theme='auto'],\n[data-theme='navy'] {\n${block(navy)}\n}`,
  ...THEMES.filter((theme) => theme.id !== 'navy').map(
    (theme) => `[data-theme='${theme.id}'] {\n${block(theme)}\n}`,
  ),
  `@media (prefers-color-scheme: light) {\n  [data-theme='auto'] {\n${block(light)
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')}\n  }\n}`,
  '',
].join('\n\n');
writeFileSync(output, scss);

const summary = THEMES.map((theme) => ({
  id: theme.id,
  name: theme.name,
  tagline: theme.tagline,
  dark: theme.dark,
  surface: theme.surface,
}));
writeFileSync(catalog, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`${THEMES.length} themes, every text pair at 4.5:1 or more`);
