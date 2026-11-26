export interface SectionPosition {
  readonly id: string;
  /** Distance in px from the top of the viewport to the top of the section. */
  readonly top: number;
}

/**
 * The section a reader is looking at: the lowest one whose top has scrolled past `line`
 * (the bottom edge of the sticky header). Once the page can't scroll further, the last section
 * wins, so a short final section still lights up its tab.
 */
export function activeSection(
  sections: readonly SectionPosition[],
  line: number,
  atEnd: boolean,
): string | null {
  const ordered = [...sections].sort((a, b) => a.top - b.top);
  if (ordered.length === 0) return null;
  if (atEnd) return ordered[ordered.length - 1].id;
  let current = ordered[0].id;
  for (const section of ordered) {
    if (section.top <= line) current = section.id;
  }
  return current;
}
