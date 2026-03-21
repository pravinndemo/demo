import { CONTROL_CONFIG } from '../config/ControlConfig';
import { buildGridApiParams } from '../utils/GridDataParams';

describe('grid data params', () => {
  const originalCountryListYearGate = CONTROL_CONFIG.enableCountryListYearApiParams;

  afterEach(() => {
    CONTROL_CONFIG.enableCountryListYearApiParams = originalCountryListYearGate;
  });

  test('builds params with paging, source, sort, search, requestedBy, and keeps country/listYear gated off by default', () => {
    CONTROL_CONFIG.enableCountryListYearApiParams = false;

    const params = buildGridApiParams({
      tableKey: 'sales',
      filters: { saleId: 'S-1000001' },
      source: ' SRS ',
      requestedBy: ' 11111111-1111-1111-1111-111111111111 ',
      currentPage: 1,
      pageSize: 25,
      clientSort: { name: 'Sale Id', sortDirection: 1 },
      searchQuery: 'columnFilter=taskStatus~in~Assigned',
      country: ' England ',
      listYear: ' 2026 ',
    });

    expect(params.saleId).toBe('S-1000001');
    expect(params.source).toBe('SRS');
    expect(params.pageNumber).toBe('2');
    expect(params.pageSize).toBe('25');
    expect(params.sortField).toBe('saleId');
    expect(params.sortDirection).toBe('desc');
    expect(params.SearchQuery).toBe('columnFilter=taskStatus~in~Assigned');
    expect(params.RequestedBy).toBe('11111111-1111-1111-1111-111111111111');
    expect(params.country).toBeUndefined();
    expect(params.listYear).toBeUndefined();
  });

  test('includes country/listYear when the gate is enabled', () => {
    CONTROL_CONFIG.enableCountryListYearApiParams = true;

    const params = buildGridApiParams({
      tableKey: 'sales',
      filters: {},
      currentPage: 0,
      pageSize: 50,
      country: ' England ',
      listYear: ' 2026 ',
    });

    expect(params.country).toBe('England');
    expect(params.listYear).toBe('2026');
  });

  test('omits optional params when empty', () => {
    CONTROL_CONFIG.enableCountryListYearApiParams = true;

    const params = buildGridApiParams({
      tableKey: 'sales',
      filters: {},
      source: ' ',
      requestedBy: '',
      currentPage: 0,
      pageSize: 50,
      clientSort: { name: 'salePrice', sortDirection: 0 },
      country: ' ',
      listYear: '',
    });

    expect(params.source).toBeUndefined();
    expect(params.RequestedBy).toBeUndefined();
    expect(params.SearchQuery).toBeUndefined();
    expect(params.country).toBeUndefined();
    expect(params.listYear).toBeUndefined();
    expect(params.pageNumber).toBe('1');
    expect(params.pageSize).toBe('50');
    expect(params.sortField).toBe('salesPrice');
    expect(params.sortDirection).toBe('asc');
  });
});

