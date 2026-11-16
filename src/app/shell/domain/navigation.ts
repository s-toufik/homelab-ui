import type { HomelabFeature } from './homelab-feature';

export const NAV_SECTIONS = ['Observe', 'Operate', 'Automate'] as const;
export type NavSection = (typeof NAV_SECTIONS)[number];

export function navSection(feature: Pick<HomelabFeature, 'category'>): NavSection {
  if (feature.category === 'Observability') return 'Observe';
  if (feature.category === 'Automation') return 'Automate';
  return 'Operate';
}

export const SHELL_ICONS = {
  today: ['M4 5h16v15H4z', 'M4 9h16', 'M9 3v4M15 3v4'],
  assistant: ['M5 5h14v10H9l-4 4z'],
  agents: [
    'M4 20v-1a5 5 0 0 1 10 0v1',
    'M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
    'M18 4l.8 1.9L21 7l-2.2.6L18 10l-.8-2.4L15 7l2.2-1.1z',
    'M15.5 14.5a4.5 4.5 0 0 1 4.5 4.5v1',
  ],
  map: ['M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z', 'M9 4v13.5M15 6.5V20'],
  people: [
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
    'M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5',
    'M16 4.5a3.5 3.5 0 0 1 0 6.8M18 14.6c1.8.6 3 2.5 3.5 5.4',
  ],
  settings: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4',
  ],
  browse: ['M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'],
  you: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z', 'M20 20l-4-4'],
  chevron: ['M6 9l6 6 6-6'],
} as const;
