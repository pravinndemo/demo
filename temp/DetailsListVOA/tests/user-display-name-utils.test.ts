import { isGuidLikeValue, resolveUserDisplayName } from '../components/SaleDetailsShell/utils';

describe('user display name resolution', () => {
  const lookup: Record<string, string> = {
    'cc4cc1fc-aeb8-ef11-b8e8-002248c64505': 'Caseworker One',
  };

  test('returns display name when database value already contains a name', () => {
    expect(resolveUserDisplayName('Maria Augustine', lookup)).toBe('Maria Augustine');
  });

  test('resolves GUID values regardless of casing/braces', () => {
    expect(resolveUserDisplayName('cc4cc1fc-aeb8-ef11-b8e8-002248c64505', lookup)).toBe('Caseworker One');
    expect(resolveUserDisplayName('{CC4CC1FC-AEB8-EF11-B8E8-002248C64505}', lookup)).toBe('Caseworker One');
  });

  test('falls back gracefully when GUID has no matching user', () => {
    expect(resolveUserDisplayName('8D75F389-A7F6-F011-8406-6045BD0B0506', lookup)).toBe('Unknown User');
  });

  test('detects GUID-like values safely', () => {
    expect(isGuidLikeValue('8D75F389-A7F6-F011-8406-6045BD0B0506')).toBe(true);
    expect(isGuidLikeValue('{8D75F389-A7F6-F011-8406-6045BD0B0506}')).toBe(true);
    expect(isGuidLikeValue('Maria Augustine')).toBe(false);
    expect(isGuidLikeValue('')).toBe(false);
  });
});
