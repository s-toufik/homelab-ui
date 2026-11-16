const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function partOfDay(hour: number): string {
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function dateLine(now: Date): string {
  return `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

export function greeting(now: Date, name: string): string {
  const hello = now.getHours() < 5 ? 'Good night' : `Good ${partOfDay(now.getHours())}`;
  return name ? `${hello}, ${name}.` : `${hello}.`;
}

export function displayName(username: string | undefined): string {
  if (!username) return '';
  const first = username.split(/[._-]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export interface BriefingFacts {
  readonly waiting: readonly { agent: string }[];
  readonly homelab: {
    readonly online: number;
    readonly total: number;
    readonly alerts: number;
    readonly warnings: readonly string[];
  } | null;
}

export function briefing(facts: BriefingFacts): string[] {
  const sentences: string[] = [];
  const waiting = facts.waiting;
  if (waiting.length === 1) sentences.push(`${waiting[0].agent} has a plan waiting for you.`);
  else if (waiting.length > 1) sentences.push(`${waiting.length} plans are waiting for you.`);

  const homelab = facts.homelab;
  if (homelab) {
    const healthy =
      homelab.alerts === 0 && homelab.warnings.length === 0 && homelab.online === homelab.total;
    if (healthy && homelab.total)
      sentences.push(
        `The homelab is healthy: all ${homelab.total} apps answer and no alert is firing.`,
      );
    else if (homelab.total) {
      const parts = [`${homelab.online} of ${homelab.total} apps answer`];
      if (homelab.alerts)
        parts.push(`${homelab.alerts} alert${homelab.alerts === 1 ? ' is' : 's are'} firing`);
      sentences.push(`${parts.join(' and ')}.`);
    }
    if (homelab.warnings.length)
      sentences.push(
        `One thing to look at: ${homelab.warnings[0].charAt(0).toLowerCase()}${homelab.warnings[0].slice(1)}.`,
      );
  }
  if (!sentences.length)
    sentences.push('Nothing is waiting for you. Ask anything with the field above.');
  return sentences;
}
