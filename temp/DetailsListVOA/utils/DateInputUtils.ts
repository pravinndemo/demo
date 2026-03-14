const UK_DATE_INPUT_REGEX = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
const ISO_DATE_INPUT_REGEX = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

const buildValidDate = (year: number, month: number, day: number): Date | null => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const candidate = new Date(year, month - 1, day);
  candidate.setHours(0, 0, 0, 0);

  if (
    candidate.getFullYear() !== year
    || candidate.getMonth() !== month - 1
    || candidate.getDate() !== day
  ) {
    return null;
  }

  return candidate;
};

export const parseDateInput = (dateStr: string): Date | null => {
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const ukMatch = UK_DATE_INPUT_REGEX.exec(trimmed);
  if (ukMatch) {
    const [, dayRaw, monthRaw, yearRaw] = ukMatch;
    return buildValidDate(Number(yearRaw), Number(monthRaw), Number(dayRaw));
  }

  const isoMatch = ISO_DATE_INPUT_REGEX.exec(trimmed);
  if (isoMatch) {
    const [, yearRaw, monthRaw, dayRaw] = isoMatch;
    return buildValidDate(Number(yearRaw), Number(monthRaw), Number(dayRaw));
  }

  return null;
};
