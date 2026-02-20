import {
  parseAssignableUsersResponse,
  resolveAssignmentStatusValidation,
  type AssignmentConfig,
} from '../utils/AssignmentHelpers';

describe('assignment helpers', () => {
  const messages = {
    noUsersFound: 'No users found.',
    assignableUsersParseFailed: 'Parse failed.',
    assignableUsersLoadFailed: 'Load failed.',
  };

  test('manager assignment errors on mixed new/non-new statuses', () => {
    const cfg: AssignmentConfig = { allowedStatusesManager: [], allowedStatusesQc: [], allowedStatuses: [] };
    const result = resolveAssignmentStatusValidation(
      [{ taskstatus: 'New' }, { taskStatus: 'Assigned' }],
      'managerAssign',
      cfg,
      'invalid',
    );
    expect(result.error).toBe('invalid');
  });

  test('manager assignment sets task status for all new', () => {
    const cfg: AssignmentConfig = { allowedStatusesManager: [], allowedStatusesQc: [], allowedStatuses: [] };
    const result = resolveAssignmentStatusValidation(
      [{ taskstatus: 'New' }],
      'managerAssign',
      cfg,
      'invalid',
    );
    expect(result.assignmentTaskStatus).toBe('New');
    expect(result.error).toBeUndefined();
  });

  test('qc assignment errors on mixed qc requested/non-qc requested', () => {
    const cfg: AssignmentConfig = { allowedStatusesManager: [], allowedStatusesQc: [], allowedStatuses: [] };
    const result = resolveAssignmentStatusValidation(
      [{ taskstatus: 'QC Requested' }, { taskStatus: 'Assigned' }],
      'qcAssign',
      cfg,
      'invalid',
    );
    expect(result.error).toBe('invalid');
  });

  test('enforces allowed statuses for non-assignment screens', () => {
    const cfg: AssignmentConfig = {
      allowedStatusesManager: [],
      allowedStatusesQc: [],
      allowedStatuses: ['assigned'],
    };
    const result = resolveAssignmentStatusValidation(
      [{ taskstatus: 'In Progress' }],
      'caseworkerView',
      cfg,
      'invalid',
    );
    expect(result.error).toBe('invalid');
  });

  test('parseAssignableUsersResponse handles empty result', () => {
    const parsed = parseAssignableUsersResponse({}, messages);
    expect(parsed.users).toHaveLength(0);
    expect(parsed.info).toBe(messages.noUsersFound);
  });

  test('parseAssignableUsersResponse handles invalid JSON', () => {
    const parsed = parseAssignableUsersResponse({ Result: '{' }, messages);
    expect(parsed.error).toBe(messages.assignableUsersParseFailed);
  });

  test('parseAssignableUsersResponse handles success=false with message', () => {
    const parsed = parseAssignableUsersResponse(
      { Result: JSON.stringify({ success: false, message: 'boom' }) },
      messages,
    );
    expect(parsed.error).toBe('boom');
  });

  test('parseAssignableUsersResponse handles success=true with users', () => {
    const parsed = parseAssignableUsersResponse(
      {
        Result: JSON.stringify({
          success: true,
          users: [
            { id: '', firstName: 'Ignore', lastName: 'Me', email: '', team: '', role: '' },
            { id: '1', firstName: 'A', lastName: 'B', email: 'a@b.com', team: 't', role: 'r' },
          ],
        }),
      },
      messages,
    );
    expect(parsed.users).toHaveLength(1);
    expect(parsed.users[0].id).toBe('1');
  });
});
