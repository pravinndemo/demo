import {
  abbreviateSummaryFlagLabel,
  getFlaggedForReviewTagMeta,
  getSummaryFlagTagMeta,
  getTaskStatusTagMeta,
} from '../utils/TagSemanticUtils';

describe('tag semantic utils', () => {
  describe('flagged for review chips', () => {
    test('maps true-like values to a yes chip', () => {
      const meta = getFlaggedForReviewTagMeta('true');
      expect(meta?.label).toBe('Yes');
      expect(meta?.spokenText).toBe('Flagged for review: Yes');
      expect(meta?.variant).toBe('flagged');
    });

    test('maps false-like values to a no chip', () => {
      const meta = getFlaggedForReviewTagMeta('No');
      expect(meta?.label).toBe('No');
      expect(meta?.spokenText).toBe('Flagged for review: No');
      expect(meta?.variant).toBe('clear');
    });
  });

  describe('task status chips', () => {
    test('treats completed qc outcomes as success', () => {
      const meta = getTaskStatusTagMeta('Complete Passed QC');
      expect(meta?.label).toBe('Complete Passed QC');
      expect(meta?.variant).toBe('successStrong');
      expect(meta?.spokenText).toBe('Task status: Complete Passed QC');
      expect(meta?.titleText).toBe('Complete Passed QC');
    });

    test('treats qc workflow states as qc chips', () => {
      const meta = getTaskStatusTagMeta('Assigned To QC');
      expect(meta?.variant).toBe('qc');
    });

    test('treats failures as danger chips', () => {
      const meta = getTaskStatusTagMeta('Assigned QC Failed');
      expect(meta?.variant).toBe('danger');
    });
  });

  describe('summary flag chips', () => {
    test('abbreviates multi-word flags to initials', () => {
      expect(abbreviateSummaryFlagLabel('Low confidence')).toBe('LC');
      expect(abbreviateSummaryFlagLabel('Outlier ratio high')).toBe('ORH');
    });

    test('abbreviates single-word flags to three letters', () => {
      expect(abbreviateSummaryFlagLabel('Standard')).toBe('STA');
    });

    test('treats standard as a success chip and keeps the full tooltip text', () => {
      const meta = getSummaryFlagTagMeta('Standard');
      expect(meta?.label).toBe('STA');
      expect(meta?.titleText).toBe('Standard');
      expect(meta?.variant).toBe('success');
    });

    test('treats outlier ratio high as a danger chip', () => {
      const meta = getSummaryFlagTagMeta('Outlier ratio high');
      expect(meta?.label).toBe('ORH');
      expect(meta?.variant).toBe('danger');
    });

    test('treats manual checks as warning chips', () => {
      const meta = getSummaryFlagTagMeta('Manual check');
      expect(meta?.label).toBe('MC');
      expect(meta?.variant).toBe('warning');
    });

    test('treats address-related checks as info chips', () => {
      const meta = getSummaryFlagTagMeta('Check address');
      expect(meta?.label).toBe('CA');
      expect(meta?.variant).toBe('info');
    });

    test('keeps unknown values stable with a soft fallback palette and full tooltip text', () => {
      const first = getSummaryFlagTagMeta('Boundary anomaly review');
      const second = getSummaryFlagTagMeta('Boundary anomaly review');
      expect(first?.label).toBe('BAR');
      expect(first?.titleText).toBe('Boundary anomaly review');
      expect(first?.spokenText).toBe('Summary flag: Boundary anomaly review');
      expect(first?.colors).toEqual(second?.colors);
    });
  });
});
