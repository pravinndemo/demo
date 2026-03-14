import { SCREEN_TEXT } from '../constants/ScreenText';

describe('screen text', () => {
  test('qc view empty state matches No results found', () => {
    expect(SCREEN_TEXT.qcView.emptyState?.title).toBe('No results found');
    expect(SCREEN_TEXT.qcView.emptyState?.message ?? '').toBe('');
  });

  test('prefilter accessibility text includes the required field key', () => {
    expect(SCREEN_TEXT.managerAssignment.prefilter.accessibility.requiredFieldKey).toBe('Fields marked with * are required');
    expect(SCREEN_TEXT.qcAssignment.prefilter.accessibility.requiredFieldKey).toBe('Fields marked with * are required');
    expect(SCREEN_TEXT.qcView.prefilter.accessibility.requiredFieldKey).toBe('Fields marked with * are required');
  });

  test('common table text includes the results summary and horizontal scroll cue', () => {
    expect(SCREEN_TEXT.common.selectionControls.resultsSummaryText).toBe('Showing {from}-{to} of {total}');
    expect(SCREEN_TEXT.common.selectionControls.resultsSummaryEmptyText).toBe('Showing 0 of 0');
    expect(SCREEN_TEXT.common.selectionControls.resultsScrollHintText).toBe('Scroll for more columns');
  });

  test('sales search text includes a visible UPRN entry hint', () => {
    expect(SCREEN_TEXT.salesSearch.hints.uprnInput).toBe('Digits only. Letters and symbols are removed automatically.');
  });

  test('sales search accessibility text includes the required field key', () => {
    expect(SCREEN_TEXT.salesSearch.accessibility.requiredFieldKey).toBe('Fields marked with * are required');
  });
});
