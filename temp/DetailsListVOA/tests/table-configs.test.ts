import { getColumnFilterConfigFor } from '../config/TableConfigs';

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
});
