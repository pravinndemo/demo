export interface SemanticTagColors {
  background: string;
  borderColor: string;
  color: string;
}

export interface SemanticTagMeta {
  label: string;
  spokenText: string;
  titleText: string;
  variant: string;
  className: string;
  colors: SemanticTagColors;
}

const PALETTES = {
  success: { background: '#E8F5EE', borderColor: '#237A57', color: '#0F4F37' },
  successStrong: { background: '#DFF3E8', borderColor: '#1C6A4D', color: '#0B4330' },
  info: { background: '#E8F1FA', borderColor: '#2B6CB0', color: '#173F6D' },
  qc: { background: '#EFEAFE', borderColor: '#6B46C1', color: '#44267C' },
  warning: { background: '#FFF4E5', borderColor: '#C77A00', color: '#7A3D00' },
  danger: { background: '#FDECEE', borderColor: '#B42318', color: '#7A271A' },
  neutral: { background: '#F3F4F6', borderColor: '#9AA4AF', color: '#344054' },
} satisfies Record<string, SemanticTagColors>;

const SUMMARY_FALLBACK_PALETTE: SemanticTagColors[] = [
  { background: '#E8F1FA', borderColor: '#2B6CB0', color: '#173F6D' },
  { background: '#EAF6F1', borderColor: '#1E7A62', color: '#0F4F3F' },
  { background: '#FFF4E5', borderColor: '#C77A00', color: '#7A3D00' },
  { background: '#F5EEFF', borderColor: '#7C3AED', color: '#4C1D95' },
  { background: '#FDECEE', borderColor: '#B42318', color: '#7A271A' },
];

const TASK_STATUS_RULES: { variant: keyof typeof PALETTES; phrases: string[] }[] = [
  { variant: 'danger', phrases: ['assigned qc failed', 'failed', 'rejected', 'blocked', 'error'] },
  { variant: 'successStrong', phrases: ['complete passed qc', 'passed qc'] },
  { variant: 'success', phrases: ['complete', 'completed', 'closed', 'done', 'passed'] },
  { variant: 'qc', phrases: ['assigned to qc', 'reassigned to qc', 'qc requested', 'awaiting qc'] },
  { variant: 'info', phrases: ['assigned', 'in progress', 'progress', 'new', 'open'] },
];

const SUMMARY_FLAG_RULES: { variant: keyof typeof PALETTES; phrases: string[] }[] = [
  { variant: 'danger', phrases: ['outlier', 'low confidence', 'high risk', 'critical', 'severe', 'exception', 'anomaly', 'suspicious'] },
  { variant: 'warning', phrases: ['manual', 'review', 'verify', 'investigate', 'follow up', 'follow-up'] },
  { variant: 'info', phrases: ['address', 'postcode', 'uprn', 'billing', 'authority', 'reference', 'comp', 'comps', 'comparable', 'check'] },
  { variant: 'success', phrases: ['standard', 'clear', 'valid', 'validated', 'normal', 'ok', 'okay', 'passed'] },
];

function normalizeValue(text: string): string {
  return (text ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildTagMeta(
  label: string,
  spokenText: string,
  titleText: string,
  variant: string,
  className: string,
  colors: SemanticTagColors,
): SemanticTagMeta {
  return { label, spokenText, titleText, variant, className, colors };
}

function findVariant(normalized: string, rules: { variant: keyof typeof PALETTES; phrases: string[] }[]): keyof typeof PALETTES | undefined {
  for (const rule of rules) {
    if (rule.phrases.some((phrase) => normalized.includes(phrase))) {
      return rule.variant;
    }
  }
  return undefined;
}

function getStableFallbackColors(text: string): SemanticTagColors {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash + text.charCodeAt(i) * (i + 1)) % 997;
  }
  return SUMMARY_FALLBACK_PALETTE[hash % SUMMARY_FALLBACK_PALETTE.length];
}

export function getFlaggedForReviewTagMeta(text: string): SemanticTagMeta | undefined {
  const normalized = normalizeValue(text);
  if (!normalized) return undefined;
  if (['true', 'yes', '1', 'flagged'].includes(normalized)) {
    return buildTagMeta(
      'Yes',
      'Flagged for review: Yes',
      'Flagged for review: Yes',
      'flagged',
      'voa-semantic-chip voa-review-flag-tag voa-review-flag-tag--flagged',
      PALETTES.warning,
    );
  }
  if (['false', 'no', '0', 'clear', 'not flagged'].includes(normalized)) {
    return buildTagMeta(
      'No',
      'Flagged for review: No',
      'Flagged for review: No',
      'clear',
      'voa-semantic-chip voa-review-flag-tag voa-review-flag-tag--clear',
      PALETTES.success,
    );
  }
  return undefined;
}

export function getTaskStatusTagMeta(text: string): SemanticTagMeta | undefined {
  const label = (text ?? '').trim();
  const normalized = normalizeValue(text);
  if (!label) return undefined;
  const variant = findVariant(normalized, TASK_STATUS_RULES) ?? 'neutral';
  return buildTagMeta(
    label,
    `Task status: ${label}`,
    label,
    variant,
    `voa-semantic-chip voa-task-status-chip voa-task-status-chip--${variant}`,
    PALETTES[variant],
  );
}

export function abbreviateSummaryFlagLabel(text: string): string {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return '';
  const tokens = trimmed.split(/[\s/_-]+/).map((token) => token.trim()).filter((token) => token.length > 0);
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (tokens.length <= 1) {
    const letters = trimmed.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const prefix = letters.length <= 3 ? letters : letters.slice(0, 3);
    return `${prefix}${digits}`;
  }
  const initials = tokens
    .map((token) => token.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((token) => token.length > 0)
    .map((token) => token[0].toUpperCase())
    .join('');
  return `${initials}${digits}`;
}

export function getSummaryFlagTagMeta(text: string): SemanticTagMeta | undefined {
  const label = (text ?? '').trim();
  const normalized = normalizeValue(text);
  if (!label) return undefined;
  const variant = findVariant(normalized, SUMMARY_FLAG_RULES);
  const colors = variant ? PALETTES[variant] : getStableFallbackColors(label);
  return buildTagMeta(
    abbreviateSummaryFlagLabel(label),
    `Summary flag: ${label}`,
    label,
    variant ?? 'custom',
    `voa-semantic-chip voa-summary-flag-chip voa-summary-flag-chip--${variant ?? 'custom'}`,
    colors,
  );
}
