import { type AssignUser } from '../Component.types';
import { type ScreenKind } from './ScreenResolution';

export interface AssignmentConfig {
  allowedStatusesManager: string[];
  allowedStatusesQc: string[];
  allowedStatuses: string[];
}

export interface AssignmentStatusResult {
  error?: string;
  assignmentTaskStatus?: string;
}

interface AssignableUsersResult {
  success?: boolean;
  message?: string;
  users?: AssignUser[];
}

export interface AssignableUsersMessages {
  noUsersFound: string;
  assignableUsersParseFailed: string;
  assignableUsersLoadFailed: string;
}

export const resolveAssignmentStatusValidation = (
  records: Record<string, unknown>[],
  screenKind: ScreenKind,
  assignmentConfig: AssignmentConfig,
  invalidStatusMessage: string,
): AssignmentStatusResult => {
  const allowedStatuses = (
    screenKind === 'managerAssign'
      ? assignmentConfig.allowedStatusesManager
      : screenKind === 'qcAssign'
        ? assignmentConfig.allowedStatusesQc
        : assignmentConfig.allowedStatuses
  ).map((s) => s.toLowerCase());

  const normalizedStatuses: string[] = [];
  for (const rec of records) {
    const statusRaw = (rec.taskstatus ?? rec.taskStatus ?? '') as string;
    const normalized = String(statusRaw ?? '').trim().toLowerCase();
    if (normalized) {
      normalizedStatuses.push(normalized);
    }
    if (allowedStatuses.length > 0 && normalized && !allowedStatuses.includes(normalized)) {
      return { error: invalidStatusMessage };
    }
  }

  let assignmentTaskStatus: string | undefined;
  if (screenKind === 'managerAssign') {
    const hasNew = normalizedStatuses.includes('new');
    const hasNonNew = normalizedStatuses.some((status) => status !== 'new');
    if (hasNew && hasNonNew) {
      return { error: invalidStatusMessage };
    }
    assignmentTaskStatus = hasNew ? 'New' : 'NULL';
  }
  if (screenKind === 'qcAssign') {
    const hasQcRequested = normalizedStatuses.includes('qc requested');
    const hasNonQcRequested = normalizedStatuses.some((status) => status !== 'qc requested');
    if (hasQcRequested && hasNonQcRequested) {
      return { error: invalidStatusMessage };
    }
    assignmentTaskStatus = hasQcRequested ? 'QC Requested' : 'NULL';
  }

  return { assignmentTaskStatus };
};

export const parseAssignableUsersResponse = (
  response: { Result?: string; result?: string } | undefined,
  messages: AssignableUsersMessages,
): { users: AssignUser[]; info?: string; error?: string } => {
  const rawResult = typeof response?.Result === 'string'
    ? response.Result
    : typeof response?.result === 'string'
      ? response.result
      : '';

  const normalizedRaw = rawResult.trim();
  if (!normalizedRaw || normalizedRaw.toLowerCase() === 'null') {
    return { users: [] as AssignUser[], info: messages.noUsersFound };
  }

  let parsed: AssignableUsersResult | undefined;
  try {
    parsed = JSON.parse(normalizedRaw) as AssignableUsersResult;
  } catch {
    return { users: [] as AssignUser[], error: messages.assignableUsersParseFailed };
  }

  if (!parsed?.success) {
    return { users: [] as AssignUser[], error: parsed?.message ?? messages.assignableUsersLoadFailed };
  }

  const users = Array.isArray(parsed.users) ? parsed.users : [];
  if (users.length === 0) {
    const message = parsed?.message?.trim() ? parsed.message : messages.noUsersFound;
    return { users: [] as AssignUser[], info: message };
  }

  const normalized = users
    .map((u) => ({
      id: String(u?.id ?? ''),
      firstName: String(u?.firstName ?? ''),
      lastName: String(u?.lastName ?? ''),
      email: String(u?.email ?? ''),
      team: String(u?.team ?? ''),
      role: String(u?.role ?? ''),
    }))
    .filter((u) => u.id);

  return { users: normalized };
};
