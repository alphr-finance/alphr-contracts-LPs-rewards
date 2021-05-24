export function compareToken(a: string, b: string): -1 | 1 {
  return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
}

export function sortedTokens(
  a: string,
  b: string
): [typeof a, typeof b] | [typeof b, typeof a] {
  return compareToken(a, b) < 0 ? [a, b] : [b, a];
}
