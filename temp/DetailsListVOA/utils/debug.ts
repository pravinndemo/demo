const PREFIX = '[SVT]';

const isEnabled = (): boolean =>
  (globalThis as unknown as { SVT_DEBUG?: boolean }).SVT_DEBUG === true;

export const svtDebug = {
  log: (tag: string, message: string, ...data: unknown[]): void => {
    if (!isEnabled()) return;
    // eslint-disable-next-line no-console
    console.log(`${PREFIX}[${tag}]`, message, ...data);
  },
  warn: (tag: string, message: string, ...data: unknown[]): void => {
    if (!isEnabled()) return;
    // eslint-disable-next-line no-console
    console.warn(`${PREFIX}[${tag}]`, message, ...data);
  },
  error: (tag: string, message: string, ...data: unknown[]): void => {
    if (!isEnabled()) return;
    // eslint-disable-next-line no-console
    console.error(`${PREFIX}[${tag}]`, message, ...data);
  },
  group: (tag: string, label: string): void => {
    if (!isEnabled()) return;
    // eslint-disable-next-line no-console
    console.groupCollapsed(`${PREFIX}[${tag}] ${label}`);
  },
  groupEnd: (): void => {
    if (!isEnabled()) return;
    // eslint-disable-next-line no-console
    console.groupEnd();
  },
  table: (tag: string, data: unknown): void => {
    if (!isEnabled()) return;
    // eslint-disable-next-line no-console
    console.log(`${PREFIX}[${tag}]`);
    // eslint-disable-next-line no-console
    console.table(data);
  },
};
