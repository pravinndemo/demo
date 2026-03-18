import { getColumnFilterConfigFor, isLookupFieldFor } from '../config/TableConfigs';

describe('table column filter config', () => {
  test('shows Yes/No labels for flagged for review', () => {
    expect(getColumnFilterConfigFor('sales', 'flaggedForReview')).toEqual({
      control: 'singleSelect',
      options: [
        { key: 'true', text: 'Yes' },
        { key: 'false', text: 'No' },
      ],
      minLength: 1,
    });
  });

  test('keeps assigned-to fields as lookup single-selects across all table keys', () => {
    const tableKeys = ['sales', 'allsales', 'myassignment', 'manager', 'qa', 'qaassign', 'qaview'];

    tableKeys.forEach((tableKey) => {
      expect(getColumnFilterConfigFor(tableKey, 'assignedto')).toEqual({
        control: 'singleSelect',
        optionFields: ['assignedto'],
        minLength: 1,
      });
      expect(getColumnFilterConfigFor(tableKey, 'qcassignedto')).toEqual({
        control: 'singleSelect',
        optionFields: ['qcassignedto'],
        minLength: 1,
      });
      expect(isLookupFieldFor(tableKey, 'assignedto')).toBe(true);
      expect(isLookupFieldFor(tableKey, 'qcassignedto')).toBe(true);
    });
  });
});
