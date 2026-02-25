const startOfDay = (value: Date): Date => {
  const next = new Date(value.getTime());
  next.setHours(0, 0, 0, 0);
  return next;
};

const toISODateString = (date?: Date | null): string | undefined => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseISODateString = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map((v) => Number(v));
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

export const computeCompletedToDateIso = (from?: Date | null, todayOverride?: Date): string | undefined => {
  if (!from) return undefined;
  const start = startOfDay(from);
  const today = startOfDay(todayOverride ?? new Date());
  const target = new Date(start.getTime());
  target.setDate(target.getDate() + 14);
  const toDate = target > today ? today : target;
  return toISODateString(toDate);
};

export const getPrefilterFromDateError = (fromIso?: string, todayOverride?: Date): string | undefined => {
  if (!fromIso) return undefined;
  const from = parseISODateString(fromIso);
  if (!from) return undefined;
  const today = startOfDay(todayOverride ?? new Date());
  if (from > today) return 'Start date cannot be in the future';
  return undefined;
};
