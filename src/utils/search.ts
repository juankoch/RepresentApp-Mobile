export function matchesSearch(value: string, query: string) {
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }

  const haystack = normalizeSearchText(value);
  return tokens.every((token) => haystack.includes(token));
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
