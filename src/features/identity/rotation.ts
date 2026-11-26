export function deduplicateRotation<T>(rotate: (token: string) => Promise<T>) {
  const pending = new Map<string, Promise<T>>();

  return (token: string): Promise<T> => {
    if (!pending.has(token)) {
      pending.set(token, Promise.resolve().then(() => rotate(token)).finally(() => pending.delete(token)));
    }
    return pending.get(token)!;
  };
}
