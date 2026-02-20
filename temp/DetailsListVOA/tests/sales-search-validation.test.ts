import { type GridFilterState } from '../Filters';
import { getSalesSearchErrors } from '../utils/SalesSearchValidation';

const withFilters = (overrides: Partial<GridFilterState>): GridFilterState => ({
  searchBy: 'saleId',
  ...overrides,
});

describe('sales search validation', () => {
  test('flags invalid sale id', () => {
    const errors = getSalesSearchErrors(
      withFilters({ searchBy: 'saleId', saleId: 'S-' }),
    );
    expect(errors.saleId).toBe('Please enter a valid Sale ID');
  });

  test('flags short task id', () => {
    const errors = getSalesSearchErrors(
      withFilters({ searchBy: 'taskId', taskId: 'A-' }),
    );
    expect(errors.taskId).toBe('Enter at least 3 characters');
  });

  test('flags task id with invalid prefix', () => {
    const errors = getSalesSearchErrors(
      withFilters({ searchBy: 'taskId', taskId: 'B-123' }),
    );
    expect(errors.taskId).toBe('Use A- or M- prefix (e.g. A-1000001) or numbers only.');
  });

  test('flags non-digit UPRN', () => {
    const errors = getSalesSearchErrors(
      withFilters({ searchBy: 'uprn', uprn: 'ABC' }),
    );
    expect(errors.uprn).toBe('Please enter a valid UPRN');
  });

  test('requires billing authority when searchBy is billingAuthority', () => {
    const errors = getSalesSearchErrors(
      withFilters({ searchBy: 'billingAuthority', billingAuthority: [] }),
    );
    expect(errors.billingAuthority).toBe('Billing Authority is required');
  });

  test('flags invalid postcode in address search', () => {
    const errors = getSalesSearchErrors(
      withFilters({ searchBy: 'address', postcode: 'INVALID' }),
    );
    expect(errors.postcode).toBe('Please enter a valid postcode');
  });

  test('requires two address criteria when no valid postcode', () => {
    const errors = getSalesSearchErrors(
      withFilters({ searchBy: 'address', buildingNameNumber: '12' }),
    );
    expect(errors.address).toBe('Please provide at least two search criteria.');
  });

  test('accepts valid postcode for address search', () => {
    const errors = getSalesSearchErrors(
      withFilters({ searchBy: 'address', postcode: 'CF10 1AA' }),
    );
    expect(errors.postcode).toBeUndefined();
    expect(errors.address).toBeUndefined();
  });
});
