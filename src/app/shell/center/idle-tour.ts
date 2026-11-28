/* While nobody touches the Center, the 3D styles tour the scopes: after a pause, each scope in turn is brought
   forward for a while, then let go before the next, round and round. */
export interface TourTiming {
  readonly start: number;
  readonly show: number;
  readonly rest: number;
}

export const TOUR_TIMING: TourTiming = { start: 9000, show: 7000, rest: 2600 };

/* The scope on show after `idleMs` without input, or null between scopes and before the tour starts. */
export function tourScope(
  idleMs: number,
  scopeIds: readonly string[],
  timing: TourTiming = TOUR_TIMING,
): string | null {
  if (idleMs < timing.start || scopeIds.length === 0) return null;
  const elapsed = idleMs - timing.start;
  const period = timing.show + timing.rest;
  const round = Math.floor(elapsed / period);
  return elapsed - round * period < timing.show ? scopeIds[round % scopeIds.length] : null;
}
