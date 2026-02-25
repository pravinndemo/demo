import { type GridFilterState } from '../Filters';
import { getSalesSearchErrors } from '../utils/SalesSearchValidation';

const withFilters = (overrides: Partial<GridFilterState>): GridFilterState => ({
  searchBy: 'saleId',
  ...overrides,
});

describe('Sales search validation', () => {
  describe('getSalesSearchErrors', () => {
    test('saleId | rejects invalid format', () => {
      const errors = getSalesSearchErrors(
        withFilters({ searchBy: 'saleId', saleId: 'S-' }),
      );
      expect(errors.saleId).toBe('Please enter a valid Sale ID');
    });

    test('taskId | rejects too-short value', () => {
      const errors = getSalesSearchErrors(
        withFilters({ searchBy: 'taskId', taskId: 'A-' }),
      );
      expect(errors.taskId).toBe('Enter at least 3 characters');
    });

    test('taskId | rejects invalid prefix', () => {
      const errors = getSalesSearchErrors(
        withFilters({ searchBy: 'taskId', taskId: 'B-123' }),
      );
      expect(errors.taskId).toBe('Please enter a valid Task ID Use A- or M- prefix (e.g. A-1000001) or numbers only.');
    });

    test('uprn | rejects non-digit value', () => {
      const errors = getSalesSearchErrors(
        withFilters({ searchBy: 'uprn', uprn: 'ABC' }),
      );
      expect(errors.uprn).toBe('Please enter a valid UPRN');
    });

    test('uprn | rejects mixed alphanumeric', () => {
      const errors = getSalesSearchErrors(
        withFilters({ searchBy: 'uprn', uprn: '123A' }),
      );
      expect(errors.uprn).toBe('Please enter a valid UPRN');
    });

    test('billingAuthority | requires selection when searchBy is billingAuthority', () => {
      const errors = getSalesSearchErrors(
        withFilters({ searchBy: 'billingAuthority', billingAuthority: [] }),
      );
      expect(errors.billingAuthority).toBe('Billing Authority is required');
    });

    test('bacode | requires reference when billing authority is selected', () => {
      const errors = getSalesSearchErrors(
        withFilters({ searchBy: 'billingAuthority', billingAuthority: ['Cardiff'], bacode: '' }),
      );
      expect(errors.bacode).toBe('Billing Authority Reference is required');
    });

    test('address | rejects invalid postcode', () => {
      const errors = getSalesSearchErrors(
        withFilters({ searchBy: 'address', postcode: 'INVALID' }),
      );
      expect(errors.postcode).toBe('Please enter a valid postcode');
    });

    test('address | requires at least two criteria without postcode', () => {
      const errors = getSalesSearchErrors(
        withFilters({ searchBy: 'address', buildingNameNumber: '12' }),
      );
      expect(errors.address).toBe('Please provide at least two search criteria.');
    });

    test('address | accepts valid postcode', () => {
      const errors = getSalesSearchErrors(
        withFilters({ searchBy: 'address', postcode: 'CF10 1AA' }),
      );
      expect(errors.postcode).toBeUndefined();
      expect(errors.address).toBeUndefined();
    });
  });
});
