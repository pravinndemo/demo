export const toSortableDateKey = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/.exec(trimmed);
  if (isoMatch) {
    return `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`;
  }
  const ukMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[T\s].*)?$/.exec(trimmed);
  if (ukMatch) {
    const day = ukMatch[1].padStart(2, '0');
    const month = ukMatch[2].padStart(2, '0');
    return `${ukMatch[3]}${month}${day}`;
  }
  return trimmed.toLowerCase();
};
