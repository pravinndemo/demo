import { SCREEN_TEXT } from '../constants/ScreenText';

describe('screen text', () => {
  test('qc view empty state matches No results found', () => {
    expect(SCREEN_TEXT.qcView.emptyState?.title).toBe('No results found');
    expect(SCREEN_TEXT.qcView.emptyState?.message ?? '').toBe('');
  });
});
