export const toSortableDateKey = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    return `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`;
  }
  const ukMatch = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(trimmed);
  if (ukMatch) {
    return `${ukMatch[3]}${ukMatch[2]}${ukMatch[1]}`;
  }
  return trimmed.toLowerCase();
};
