export const idleSessionMs = 60 * 60_000;

export function idleRemaining(lastActivity: number, now: number) {
  return Math.max(0, idleSessionMs - (now - lastActivity));
}
