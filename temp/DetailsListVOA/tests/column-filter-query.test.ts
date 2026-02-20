import { buildColumnFilterQuery } from '../utils/ColumnFilterQuery';

describe('column filter query', () => {
  test('returns empty string when no filters', () => {
    const query = buildColumnFilterQuery('sales', {});
    expect(query).toBe('');
  });

  test('uses eq for single select fields', () => {
    const query = buildColumnFilterQuery('sales', { flaggedForReview: 'true' });
    expect(query).toBe('columnFilter=flaggedForReview~eq~true');
  });

  test('uses like for text fields and encodes values', () => {
    const query = buildColumnFilterQuery('sales', { address: 'High Street' });
    expect(query).toBe('columnFilter=address~like~High%20Street');
  });

  test('uses in for multi select fields', () => {
    const query = buildColumnFilterQuery('sales', { taskStatus: ['Assigned', 'Complete'] });
    expect(query).toBe('columnFilter=taskStatus~in~Assigned%2CComplete');
  });

  test('builds numeric comparisons', () => {
    const query = buildColumnFilterQuery('sales', { salePrice: { mode: '>=', min: 250000 } });
    expect(query).toBe('columnFilter=salesPrice~GTE~250000');
  });

  test('formats date ranges as dd/MM/yyyy', () => {
    const query = buildColumnFilterQuery('sales', {
      assignedDate: { from: '2026-02-01', to: '2026-02-03' },
    });
    expect(query).toBe('columnFilter=assignedDate~between~01%2F02%2F2026~03%2F02%2F2026');
  });

  test('handles numeric between with only min or max', () => {
    const minOnly = buildColumnFilterQuery('sales', { salePrice: { mode: 'between', min: 100 } });
    const maxOnly = buildColumnFilterQuery('sales', { salePrice: { mode: 'between', max: 200 } });
    expect(minOnly).toBe('columnFilter=salesPrice~GTE~100');
    expect(maxOnly).toBe('columnFilter=salesPrice~LTE~200');
  });

  test('handles date range with only one side', () => {
    const query = buildColumnFilterQuery('sales', {
      assignedDate: { from: '2026-02-01' },
    });
    expect(query).toBe('columnFilter=assignedDate~between~01%2F02%2F2026~01%2F02%2F2026');
  });

  test('drops empty array filters', () => {
    const query = buildColumnFilterQuery('sales', { taskStatus: [' ', ''] });
    expect(query).toBe('');
  });

  test('appends sort marker', () => {
    const query = buildColumnFilterQuery('sales', { address: 'High' }, { name: 'saleId', sortDirection: 1 });
    expect(query).toBe('columnFilter=address~like~High&columnFilter=saleId~SORT~DESC');
  });
});
