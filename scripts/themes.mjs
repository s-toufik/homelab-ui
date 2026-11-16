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
const CINZEL_DECORATIVE = "'Cinzel Decorative', 'Cinzel', 'Times New Roman', serif";
const FELL = "'IM Fell English', Georgia, serif";
const FELL_SC = "'IM Fell English SC', 'IM Fell English', Georgia, serif";
const GARAMOND = "'EB Garamond', Garamond, Georgia, serif";
const CORMORANT = "'Cormorant Garamond', 'EB Garamond', Georgia, serif";
const PINYON = "'Pinyon Script', 'Cormorant Garamond', cursive";
const MARCELLUS = "'Marcellus', 'Cinzel', Georgia, serif";
const MARCELLUS_SC = "'Marcellus SC', 'Marcellus', Georgia, serif";

function svg(body, width, height) {
  const markup = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>${body}</svg>`;
  return `url("data:image/svg+xml,${markup.replace(/#/g, '%23').replace(/"/g, "'")}")`;
}

function noise(r, g, b, alpha, frequency = 0.85, size = 220) {
  return svg(
    `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 ${alpha} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/>`,
    size,
    size,
  );
}

function meander(units, color, step = 16) {
  const unit = (x) =>
    `M${x} 14.5H${x + step}M${x + 12.5} 14.5V1.5H${x + 2.5}V9.5H${x + 8.5}V5.5H${x + 6.5}`;
  const path = Array.from({ length: units }, (_, i) => unit(i * step)).join('');
  return svg(
    `<path d='${path}' fill='none' stroke='${color}' stroke-width='1.6' stroke-linecap='square'/>`,
    units * step,
    16,
  );
}

const ORNAMENTS = {
  wizardingRule: svg(
    "<path d='M0 8h98M142 8h98' stroke='#A8823A' stroke-width='1'/><path d='M0 11h70M170 11h70' stroke='#A8823A' stroke-opacity='0.5' stroke-width='0.8'/><path d='M120 1l6 7-6 7-6-7z' fill='#7A1C2A'/><circle cx='106' cy='8' r='1.8' fill='#A8823A'/><circle cx='134' cy='8' r='1.8' fill='#A8823A'/><path d='M120 4.5l2.6 3.5-2.6 3.5-2.6-3.5z' fill='#E9C46A'/>",
    240,
    16,
  ),
  dragonBlade: svg(
    "<path d='M0 8L100 6.5 114 2 120 0 126 2 140 6.5 240 8 140 9.5 126 14 120 16 114 14 100 9.5Z' fill='none' stroke='#E35D3A' stroke-width='1'/><path d='M120 3.5l3.5 4.5-3.5 4.5-3.5-4.5z' fill='#E8B25A'/><path d='M30 8h60M150 8h60' stroke='#E8B25A' stroke-opacity='0.55' stroke-width='0.8'/>",
    240,
    16,
  ),
  regencySwirl: svg(
    "<path d='M8 12c26 0 34-8 52-8 16 0 22 8 40 8M232 12c-26 0-34-8-52-8-16 0-22 8-40 8' fill='none' stroke='#B8963E' stroke-width='1.2' stroke-linecap='round'/><path d='M120 2c-5 5-5 15 0 20 5-5 5-15 0-20z' fill='#B8963E'/><path d='M108 12c4-4 8-4 12 0-4 4-8 4-12 0zM132 12c-4-4-8-4-12 0 4 4 8 4 12 0z' fill='#C9AE63'/><circle cx='120' cy='12' r='2.4' fill='#3D6593'/>",
    240,
    24,
  ),
  scales: svg(
    "<path d='M0 16a14 14 0 0 1 28 0M-14 8a14 14 0 0 1 28 0M14 8a14 14 0 0 1 28 0M-14 24a14 14 0 0 1 28 0M14 24a14 14 0 0 1 28 0' fill='none' stroke='#E35D3A' stroke-opacity='0.075' stroke-width='1'/>",
    28,
    16,
  ),
  damask: svg(
    "<g fill='#3D6593' fill-opacity='0.055'><circle cx='32' cy='25' r='4.5'/><circle cx='32' cy='39' r='4.5'/><circle cx='25' cy='32' r='4.5'/><circle cx='39' cy='32' r='4.5'/><circle cx='0' cy='0' r='3'/><circle cx='64' cy='0' r='3'/><circle cx='0' cy='64' r='3'/><circle cx='64' cy='64' r='3'/></g><circle cx='32' cy='32' r='2.2' fill='#B8963E' fill-opacity='0.22'/>",
    64,
    64,
  ),
  waves: svg(
    "<path d='M0 20c10-8 20-8 30 0s20 8 30 0M0 40c10-8 20-8 30 0s20 8 30 0' fill='none' stroke='#FFFFFF' stroke-opacity='0.05' stroke-width='1.2'/>",
    60,
    40,
  ),
};

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
  parchment: {
    orange: '#8F3A06',
    teal: '#0A5E56',
    indigo: '#3A33B0',
    purple: '#5E3299',
    blue: '#0A4F9E',
    green: '#165E2B',
    rose: '#962C6A',
    amber: '#664700',
    slate: '#3E4756',
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
    id: 'wizarding',
    name: 'Wizarding',
    tagline: 'Parchment, ink and a leather-bound spine, after Harry Potter',
    storybook: true,
    dark: false,
    hues: 'parchment',
    fontSans: GARAMOND,
    fontHead: FELL,
    fontCaps: FELL_SC,
    synthesis: 'none',
    surface: '#EFE3C8',
    side: '#3B1F1C',
    raised: '#F7EEDA',
    hover: '#E6D6B3',
    sunken: '#F4EAD3',
    text: '#2A1B12',
    muted: '#5E4630',
    border: '#C8B08A',
    accent: '#7A1C2A',
    accentHover: '#631522',
    onAccent: '#F7E7B4',
    mono: '#6B3A12',
    success: '#2F6B3F',
    warning: '#76500C',
    danger: '#9E2A1F',
    dangerSoft: '#F6DCD3',
    codeSurface: '#EFE3C8',
    codeText: '#5A2A0E',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -22px rgb(42 27 18 / 45%)',
    borderWidth: '1px',
    sidePalette: {
      bg: '#3B1F1C',
      text: '#F3E4C4',
      muted: '#D2B88E',
      hover: '#4B2824',
      active: '#5A312B',
      border: '#6E4A36',
      accent: '#E2BC62',
      onAccent: '#2A1410',
    },
    skin: {
      '--body-size': '15.5px',
      '--radius-card': '0.2rem',
      '--page-texture': `radial-gradient(ellipse 90% 60% at 50% 0%, rgb(255 250 232 / 70%), transparent 70%), radial-gradient(ellipse 120% 80% at 50% 120%, rgb(110 70 25 / 22%), transparent 60%), ${noise(0.42, 0.28, 0.1, 0.13)}`,
      '--card-texture': noise(0.42, 0.28, 0.1, 0.07, 0.9, 180),
      '--card-frame':
        'inset 0 0 0 3px #F7EEDA, inset 0 0 0 4px rgb(168 130 58 / 55%), 0 1px 0 rgb(255 255 255 / 40%), 0 10px 24px -18px rgb(42 27 18 / 45%)',
      '--side-texture': `linear-gradient(90deg, rgb(0 0 0 / 18%), transparent 18%, transparent 82%, rgb(0 0 0 / 22%)), ${noise(0.12, 0.05, 0.03, 0.35, 0.7)}`,
      '--cap-color': '#7A1C2A',
      '--cap-ornament': "'✦  '",
      '--cap-tracking': '0.06em',
      '--cap-transform': 'none',
      '--cap-size': '0.95rem',
      '--head-tracking': '0',
      '--flourish': ORNAMENTS.wizardingRule,
      '--flourish-content': "''",
      '--btn-radius': '0.2rem',
      '--btn-font': FELL_SC,
      '--btn-tracking': '0.03em',
      '--btn-size': '0.95rem',
    },
  },
  {
    id: 'dragon',
    name: 'Dragon Rider',
    tagline: 'Obsidian scales, ember and riders’ steel, after Fourth Wing',
    storybook: true,
    dark: true,
    hues: 'dark',
    fontSans: GEIST,
    fontHead: CINZEL,
    fontDisplay: CINZEL_DECORATIVE,
    fontCaps: CINZEL,
    surface: '#0D0A09',
    side: '#090706',
    raised: '#16100E',
    hover: '#221815',
    sunken: '#100C0B',
    text: '#F1E6D8',
    muted: '#B19C88',
    border: '#3A2820',
    accent: '#E35D3A',
    accentHover: '#F07450',
    onAccent: '#160904',
    mono: '#E8B25A',
    success: '#7BC47F',
    warning: '#E8B25A',
    danger: '#FF6B57',
    dangerSoft: '#2C1210',
    codeSurface: '#120D0B',
    codeText: '#F0C674',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -20px rgb(0 0 0 / 80%), 0 0 0 1px rgb(227 93 58 / 25%)',
    borderWidth: '1px',
    sidePalette: {
      bg: '#090706',
      text: '#F1E6D8',
      muted: '#AE9884',
      hover: '#1A1210',
      active: '#241612',
      border: '#3A2820',
      accent: '#E35D3A',
      onAccent: '#160904',
    },
    skin: {
      '--radius-card': '0',
      '--page-texture': `radial-gradient(ellipse 80% 45% at 50% 115%, rgb(227 93 58 / 20%), transparent 70%), radial-gradient(ellipse 60% 40% at 85% -10%, rgb(232 178 90 / 8%), transparent 70%), ${ORNAMENTS.scales}`,
      '--card-texture': 'linear-gradient(180deg, rgb(255 255 255 / 3%), transparent 45%)',
      '--card-frame':
        'inset 0 1px 0 rgb(227 93 58 / 60%), inset 0 0 0 1px #3A2820, 0 18px 40px -24px rgb(0 0 0 / 90%)',
      '--side-texture': `linear-gradient(180deg, rgb(227 93 58 / 7%), transparent 30%, transparent 75%, rgb(227 93 58 / 9%)), ${ORNAMENTS.scales}`,
      '--cap-color': '#E8774F',
      '--cap-tracking': '0.22em',
      '--cap-size': '0.7rem',
      '--head-tracking': '0.02em',
      '--flourish': ORNAMENTS.dragonBlade,
      '--flourish-content': "''",
      '--btn-radius': '0',
      '--btn-font': CINZEL,
      '--btn-transform': 'uppercase',
      '--btn-tracking': '0.12em',
      '--btn-size': '0.72rem',
      '--btn-primary-image': 'linear-gradient(180deg, #F07450, #C9442A)',
    },
  },
  {
    id: 'demigod',
    name: 'Demigod',
    tagline: 'Marble, bronze and the Aegean, after Percy Jackson',
    storybook: true,
    dark: false,
    hues: 'light',
    fontSans: GEIST,
    fontHead: MARCELLUS,
    fontCaps: MARCELLUS_SC,
    synthesis: 'none',
    surface: '#F6F4EF',
    side: '#0C3B52',
    raised: '#FFFFFF',
    hover: '#ECE8DF',
    sunken: '#FAF8F4',
    text: '#1C2A33',
    muted: '#55626B',
    border: '#DACFBA',
    accent: '#0E6A8A',
    accentHover: '#0B5670',
    onAccent: '#FFFFFF',
    mono: '#86561C',
    success: '#2F6B3F',
    warning: '#845200',
    danger: '#B3261E',
    dangerSoft: '#FBE6E3',
    codeSurface: '#F1EEE7',
    codeText: '#0B5670',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -24px rgb(12 59 82 / 40%)',
    borderWidth: '1px',
    sidePalette: {
      bg: '#0C3B52',
      text: '#EEF6F9',
      muted: '#B4CCD6',
      hover: '#124A64',
      active: '#175670',
      border: '#2A5F78',
      accent: '#F08A4B',
      onAccent: '#1C1006',
    },
    skin: {
      '--radius-card': '0.15rem',
      '--page-texture': `linear-gradient(115deg, rgb(255 255 255 / 70%), transparent 40%, rgb(255 255 255 / 45%) 70%, transparent), ${noise(0.45, 0.47, 0.5, 0.06, 0.012, 320)}, ${noise(0.4, 0.42, 0.45, 0.05, 0.9, 200)}`,
      '--card-frame': 'inset 0 3px 0 #B98A4A, 0 12px 28px -22px rgb(12 59 82 / 45%)',
      '--side-texture': `linear-gradient(180deg, #0C3B52, #0A2D3F), ${ORNAMENTS.waves}`,
      '--cap-color': '#86561C',
      '--cap-ornament': "'◆  '",
      '--cap-tracking': '0.14em',
      '--cap-transform': 'none',
      '--cap-size': '0.82rem',
      '--head-tracking': '0.01em',
      '--flourish': meander(15, '#B98A4A'),
      '--flourish-content': "''",
      '--btn-radius': '0.15rem',
      '--btn-font': MARCELLUS_SC,
      '--btn-tracking': '0.06em',
      '--btn-size': '0.85rem',
    },
  },
  {
    id: 'regency',
    name: 'Regency',
    tagline: 'Wedgwood blue, gilt frames and florals, after Bridgerton',
    storybook: true,
    dark: false,
    hues: 'parchment',
    fontSans: GARAMOND,
    fontHead: CORMORANT,
    fontDisplay: PINYON,
    fontCaps: CORMORANT,
    surface: '#EEF3F9',
    side: '#DCE6F2',
    raised: '#FFFFFF',
    hover: '#E1E9F4',
    sunken: '#F6F9FC',
    text: '#22304A',
    muted: '#52607A',
    border: '#CFD9E7',
    accent: '#3D6593',
    accentHover: '#335684',
    onAccent: '#FFFFFF',
    mono: '#6E4E92',
    success: '#2F6B4F',
    warning: '#805400',
    danger: '#B3261E',
    dangerSoft: '#FBE7EA',
    codeSurface: '#F1F5FA',
    codeText: '#3D4F8A',
    shadowCard: 'none',
    shadowFloat: '0 24px 60px -24px rgb(34 48 74 / 38%)',
    borderWidth: '1px',
    sidePalette: {
      bg: '#DCE6F2',
      text: '#22304A',
      muted: '#4E5C76',
      hover: '#CFDCEC',
      active: '#FFFFFF',
      border: '#C3D1E3',
      accent: '#3D6593',
      onAccent: '#FFFFFF',
    },
    skin: {
      '--body-size': '15.5px',
      '--radius-card': '1rem',
      '--page-texture': `radial-gradient(ellipse 70% 50% at 50% 0%, rgb(255 255 255 / 85%), transparent 70%), ${ORNAMENTS.damask}`,
      '--card-frame':
        'inset 0 0 0 4px #FFFFFF, inset 0 0 0 5px rgb(201 174 99 / 55%), 0 14px 34px -22px rgb(61 101 147 / 45%)',
      '--side-texture': `linear-gradient(180deg, rgb(255 255 255 / 45%), transparent 35%), ${ORNAMENTS.damask}`,
      '--cap-color': '#7A5A12',
      '--cap-ornament': "'❦  '",
      '--cap-tracking': '0.2em',
      '--cap-size': '0.78rem',
      '--head-tracking': '0',
      '--display-adjust': '0.42',
      '--flourish': ORNAMENTS.regencySwirl,
      '--flourish-content': "''",
      '--btn-radius': '999px',
      '--btn-font': CORMORANT,
      '--btn-tracking': '0.04em',
      '--btn-size': '0.98rem',
      '--btn-weight': '700',
    },
  },
];

const SKIN_DEFAULTS = {
  '--body-size': '14px',
  '--radius-card': '0.75rem',
  '--page-texture': 'none',
  '--card-texture': 'none',
  '--card-frame': 'none',
  '--side-texture': 'none',
  '--cap-color': 'initial',
  '--cap-ornament': 'none',
  '--cap-tracking': '0.09em',
  '--cap-transform': 'uppercase',
  '--cap-size': '0.72rem',
  '--head-tracking': '-0.02em',
  '--display-adjust': 'none',
  '--flourish': 'none',
  '--flourish-content': 'none',
  '--btn-radius': '0.45rem',
  '--btn-transform': 'none',
  '--btn-tracking': 'normal',
  '--btn-size': '0.85rem',
  '--btn-weight': '500',
  '--btn-primary-image': 'none',
};

function hueSet(theme, hue) {
  const color = HUE_COLORS[theme.hues][hue];
  return {
    color,
    soft: mix(color, theme.raised, theme.dark ? 0.16 : 0.07),
  };
}

function sideOf(theme) {
  return (
    theme.sidePalette ?? {
      bg: theme.side,
      text: theme.text,
      muted: theme.muted,
      hover: theme.hover,
      active: theme.raised,
      border: theme.border,
      accent: theme.accent,
      onAccent: theme.onAccent,
    }
  );
}

function block(theme) {
  const side = sideOf(theme);
  const skin = { ...SKIN_DEFAULTS, ...(theme.skin ?? {}) };
  const lines = [
    `--font-sans: ${theme.fontSans};`,
    `--font-head: ${theme.fontHead ?? theme.fontSans};`,
    `--font-display: ${theme.fontDisplay ?? theme.fontHead ?? theme.fontSans};`,
    `--font-caps: ${theme.fontCaps ?? theme.fontSans};`,
    `--btn-font: ${skin['--btn-font'] ?? theme.fontSans};`,
    `--font-mono: ${GEIST_MONO};`,
    ...Object.entries(skin)
      .filter(([name]) => name !== '--btn-font')
      .map(([name, value]) => `${name}: ${value};`),
    `--side-bg: ${side.bg};`,
    `--side-text: ${side.text};`,
    `--side-muted: ${side.muted};`,
    `--side-hover: ${side.hover};`,
    `--side-active: ${side.active};`,
    `--side-border: ${side.border};`,
    `--side-accent: ${side.accent};`,
    `--side-on-accent: ${side.onAccent};`,
    `font-synthesis: ${theme.synthesis ?? 'initial'};`,
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
    ...(theme.sidePalette ? [] : [['text', theme.text, 'side', theme.side]]),
    ['muted', theme.muted, 'surface', theme.surface],
    ['muted', theme.muted, 'raised', theme.raised],
    ...(theme.sidePalette ? [] : [['muted', theme.muted, 'side', theme.side]]),
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
  const side = sideOf(theme);
  pairs.push(
    ['side-text', side.text, 'side-bg', side.bg],
    ['side-text', side.text, 'side-active', side.active],
    ['side-muted', side.muted, 'side-bg', side.bg],
    ['side-muted', side.muted, 'side-hover', side.hover],
    ['side-on-accent', side.onAccent, 'side-accent', side.accent],
  );
  const cap = theme.skin?.['--cap-color'];
  if (cap) pairs.push(['cap', cap, 'surface', theme.surface], ['cap', cap, 'raised', theme.raised]);
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
  storybook: theme.storybook ?? false,
  surface: theme.surface,
}));
writeFileSync(catalog, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`${THEMES.length} themes, every text pair at 4.5:1 or more`);
