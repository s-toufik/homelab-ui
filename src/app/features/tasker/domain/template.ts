export function getPath(value: unknown, path: string): unknown {
  return path
    .split('.')
    .filter((segment) => segment !== '')
    .reduce<unknown>((acc, key) => {
      if (acc === null || typeof acc !== 'object') return undefined;
      return (acc as Record<string, unknown>)[key];
    }, value);
}

export function resolveTemplate(text: string, results: ReadonlyMap<string, unknown>): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path: string) => {
    const [blockId, ...rest] = path.split('.');
    if (!results.has(blockId)) return match;
    const output = results.get(blockId);
    const resolved = rest.length > 0 ? getPath(output, rest.join('.')) : output;
    return resolved === undefined ? match : String(resolved);
  });
}
