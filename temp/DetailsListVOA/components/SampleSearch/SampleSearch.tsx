import * as React from 'react';
import { DetailsList } from '../DetailsList';
import { Selection, SelectionMode, IObjectWithKey, IDetailsList, IRefObject, Stack, Dropdown, IDropdownOption, PrimaryButton, TextField } from '@fluentui/react';
import { SAMPLE_COLUMNS, SAMPLE_RECORDS } from '../../data/SampleData';
import { ColumnConfig } from '../../Component.types';
import { createDefaultGridFilters, DateRangeFilter, GridFilterState, NumericFilter } from '../../Filters';

const EMPTY_COLUMN_CONFIGS: Record<string, ColumnConfig> = {};

type EntityRecord = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & Record<string, unknown>;
type ColumnFilterValue = string | string[] | NumericFilter | DateRangeFilter;

type SampleColumn = ComponentFramework.PropertyHelper.DataSetApi.Column & { cellType?: string };

function buildDatasetColumns(): ComponentFramework.PropertyHelper.DataSetApi.Column[] {
  return SAMPLE_COLUMNS.map((c, idx) => ({
    name: c.name,
    displayName: c.displayName,
    dataType: 'SingleLine.Text',
    alias: c.name,
    order: idx + 1,
    visualSizeFactor: c.width ?? 100,
    cellType: c.cellType,
  } as unknown as SampleColumn));
}

const toFilterValueString = (val: ColumnFilterValue | undefined): string => {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return val
      .map((v) => toFilterValueString(v as ColumnFilterValue))
      .filter((s) => s !== '')
      .join('|');
  }
  if (typeof val === 'object') return JSON.stringify(val);
  return '';
};

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
  if (Array.isArray(value)) return value.join(', ');
  return '';
}

function mapSampleToRecord(sample: Record<string, unknown>, index: number): EntityRecord {
  const base: Record<string, unknown> = {};
  const rec = base as EntityRecord;
  const id = (sample.TaskID as string) || (sample.SaleID as string) || `sample-${index}`;
  rec.getRecordId = () => id;
  rec.getNamedReference = undefined as unknown as EntityRecord['getNamedReference'];
  rec.getValue = ((columnName: string) => (rec as Record<string, unknown>)[columnName] ?? '') as EntityRecord['getValue'];
  rec.getFormattedValue = ((columnName: string) => toText((rec as Record<string, unknown>)[columnName])) as EntityRecord['getFormattedValue'];

  const lowerMap: Record<string, string> = {};
  Object.keys(sample).forEach((k) => (lowerMap[k.toLowerCase()] = k));

  const get = (candidates: string[], fallback?: string): unknown => {
    for (const c of candidates) {
      const key = lowerMap[c.toLowerCase()];
      if (key && sample[key] !== undefined) return sample[key];
    }
    return fallback ?? '';
  };

  const ratioRaw = get(['ratio']);
  const ratio = typeof ratioRaw === 'number' ? ratioRaw : Number(ratioRaw);
  const salePrice = get(['saleprice', 'sale_price', 'sale price']);
  const salePriceNum = typeof salePrice === 'number' ? salePrice : Number(salePrice);
  const marketValue = !Number.isNaN(ratio) && !Number.isNaN(salePriceNum) && ratio
    ? Math.round(salePriceNum / ratio)
    : '';

  // Map known columns used by SAMPLE_COLUMNS
  rec.uprn = get(['uprn']);
  rec.address = get(['address']);
  rec.postcode = get(['postcode', 'post code']);
  const txDate = get(['transactiondate']);
  rec.transactiondate = txDate;
  rec.transactionid = txDate; // legacy alias used earlier
  rec.saleprice = toText(salePrice);
  rec.marketvalue = marketValue === '' ? '' : toText(marketValue);
  rec.taskstatus = get(['taskstatus']);

  // Additional fields surfaced by updated SAMPLE_COLUMNS
  rec.saleid = get(['saleid']);
  rec.taskid = get(['taskid']);
  rec.billingauthority = get(['billingauthority']);
  rec.ratio = toText(ratioRaw);
  rec.dwellingtype = get(['dwellingtype']);
  rec.flaggedforreview = get(['flaggedforreview']);
  rec.reviewflags = get(['reviewflags']);
  rec.outlierratio = toText(get(['outlierratio']));
  rec.overallflag = get(['overallflag']);
  rec.summaryflags = get(['summaryflags']);
  rec.assignedto = get(['assignedto']);
  rec.qcassignedto = get(['qcassignedto']);

  return rec;
}

function buildRecords(): { records: Record<string, EntityRecord>; ids: string[] } {
  const records: Record<string, EntityRecord> = {};
  const ids: string[] = [];
  SAMPLE_RECORDS.forEach((s, i) => {
    const rec = mapSampleToRecord(s, i);
    const id = rec.getRecordId();
    records[id] = rec;
    ids.push(id);
  });
  return { records, ids };
}

export function SampleSearch(props: { pageSize?: number } = {}): JSX.Element {
  const [searchBy, setSearchBy] = React.useState<string>('taskId');
  const [loaded, setLoaded] = React.useState(false);
  const [datasetColumns] = React.useState(buildDatasetColumns());
  const [data, setData] = React.useState(() => ({ records: {} as Record<string, EntityRecord>, ids: [] as string[] }));
  const [page, setPage] = React.useState(0);
  const pageSize = props.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil((data.ids.length || 1) / pageSize));
  const componentRef = React.useRef<IDetailsList>(null);
  const selection = React.useMemo(
    () =>
      new Selection<IObjectWithKey>({
        getKey: (it: IObjectWithKey) => (it as unknown as EntityRecord).getRecordId(),
      }),
    [],
  );
  const [filters, setFilters] = React.useState<GridFilterState>(createDefaultGridFilters());
  const [headerFilters, setHeaderFilters] = React.useState<Record<string, ColumnFilterValue>>({});
  const updateFilters = React.useCallback((key: keyof GridFilterState, value: GridFilterState[keyof GridFilterState]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const searchOptions: IDropdownOption[] = [
    { key: 'taskId', text: 'Task ID' },
    { key: 'uprn', text: 'UPRN' },
    { key: 'address', text: 'Address' },
    { key: 'postcode', text: 'Postcode' },
  ];

  const handleSearch = React.useCallback(() => {
    // Load and apply both top-level filters and header filters across all sample records
    const mapped = buildRecords();
    const ids = mapped.ids.filter((id) => {
      const rec = mapped.records[id] as Record<string, unknown>;
      // Top search filters
      const r = rec as { uprn?: unknown; taskid?: unknown; address?: unknown; postcode?: unknown };
      const by = searchBy;
      let topOk = true;
      if (by === 'uprn') {
        const val = toText(r.uprn).toLowerCase();
        const q = (filters.uprn ?? '').toLowerCase();
        topOk = q === '' ? true : val.includes(q);
      } else if (by === 'taskId') {
        const val = toText(r.taskid).toLowerCase();
        const q = (filters.taskId ?? '').toLowerCase();
        topOk = q === '' ? true : val.includes(q);
      } else if (by === 'address') {
        const addr = toText(r.address).toLowerCase();
        const pc = toText(r.postcode).toLowerCase();
        const qAddr = (filters.address ?? '').toLowerCase();
        const qP = (filters.postcode ?? '').toLowerCase();
        const addrOk = qAddr ? addr.includes(qAddr) : true;
        const pcOk = qP ? pc.startsWith(qP) || addr.includes(qP) : true;
        topOk = addrOk && pcOk;
      } else if (by === 'postcode') {
        const pc = toText(r.postcode).toLowerCase();
        const q = (filters.postcode ?? '').toLowerCase();
        topOk = q.length === 0 || pc.startsWith(q);
      }
      if (!topOk) return false;
      // Header filters
      const entries = Object.entries(headerFilters).filter(([, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'string') return v.trim() !== '';
        if (v && typeof v === 'object') return JSON.stringify(v) !== '{}';
        return false;
      });
      if (entries.length === 0) return true;
      return entries.every(([field, v]) => {
        const value = toText(rec[field]).toLowerCase().trim();
        if (Array.isArray(v)) {
          const needles = v
            .map((s) => toFilterValueString(s as ColumnFilterValue).toLowerCase().trim())
            .filter((s) => s !== '');
          if (needles.length === 0) return true;
          return needles.some((n) => value === n);
        }
        const needle = toFilterValueString(v as ColumnFilterValue).toLowerCase().trim();
        if (needle === '') return true;
        return value.includes(needle);
      });
    });
    setData({ records: mapped.records, ids });
    setLoaded(true);
    setPage(0);
  }, [filters, headerFilters, searchBy]);

  const handleClear = React.useCallback(() => {
    const d = createDefaultGridFilters();
    setFilters(d);
    const mapped = buildRecords();
    setData(mapped);
    setLoaded(true);
    setPage(0);
  }, []);

  const pageIds = React.useMemo(() => {
    const start = page * pageSize;
    return data.ids.slice(start, start + pageSize);
  }, [data.ids, page]);

  const [sortedCol, setSortedCol] = React.useState<string | undefined>(undefined);
  const [sortedDesc, setSortedDesc] = React.useState(false);
  const onSort = React.useCallback((name: string, desc: boolean) => {
    setData((prev) => {
      const ids = [...prev.ids].sort((a, b) => {
        const aRec = prev.records[a] as Record<string, unknown>;
        const bRec = prev.records[b] as Record<string, unknown>;
        const av = toText(aRec[name]);
        const bv = toText(bRec[name]);
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
        return desc ? -cmp : cmp;
      });
      return { ...prev, ids };
    });
    setSortedCol(name);
    setSortedDesc(desc);
  }, []);

  const onLoadFilterOptions = React.useCallback(async (field: string, query: string): Promise<string[]> => {
    const q = (query ?? '').trim().toLowerCase();
    if (q.length === 0) return [];
    const set = new Set<string>();
    SAMPLE_RECORDS.forEach((s) => {
      const lower: Record<string, unknown> = {};
      Object.keys(s).forEach((k) => (lower[k.toLowerCase()] = (s as Record<string, unknown>)[k]));
      const v = toText(lower[field.toLowerCase()]);
      if (v?.toLowerCase().includes(q)) set.add(v);
    });
    const all = Array.from(set).sort((a, b) => a.localeCompare(b));
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 250));
    return all;
  }, []);

  const dummyResources: ComponentFramework.Resources = {
    getString: (key: string, ..._args: unknown[]) => key,
    getResource: (_id: string, _success: (data: string) => void, _error: (error: unknown) => void, _parameters?: string[]) => {
      // Satisfy interface; not used in sample mode
      try { _success(''); } catch { /* noop */ }
    },
  };

    return (
      <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginBottom: 8 } }}>
        <Stack horizontal tokens={{ childrenGap: 16 }} verticalAlign="end" styles={{ root: { alignItems: 'flex-end' } }}>
          <Dropdown
            label="Search by"
            options={searchOptions}
            selectedKey={searchBy}
            onChange={(_, o) => setSearchBy((o?.key as string) ?? 'taskId')}
            styles={{ dropdown: { width: 220 } }}
          />
          {searchBy === 'address' && (
            <Stack horizontal wrap verticalAlign="end" tokens={{ childrenGap: 12 }} styles={{ root: { rowGap: 8 } }}>
              <TextField label="Address" value={filters.address ?? ''} onChange={(_, v) => updateFilters('address', v ?? '')} />
              <TextField label="Postcode" value={filters.postcode ?? ''} onChange={(_, v) => updateFilters('postcode', (v ?? '').toUpperCase())} />
            </Stack>
          )}
          {searchBy === 'uprn' && (
            <TextField label="UPRN" value={filters.uprn ?? ''} onChange={(_, v) => updateFilters('uprn', (v ?? '').replace(/\D/g, ''))} />
          )}
          {searchBy === 'taskId' && (
            <TextField label="Task ID" value={filters.taskId ?? ''} onChange={(_, v) => updateFilters('taskId', v ?? '')} />
          )}
          {searchBy === 'postcode' && (
            <TextField label="Postcode" value={filters.postcode ?? ''} onChange={(_, v) => updateFilters('postcode', (v ?? '').toUpperCase())} />
          )}
        <PrimaryButton text="Search" onClick={handleSearch} />
        <PrimaryButton text="Clear all" onClick={handleClear} />
      </Stack>
      {loaded && (
        <DetailsList
          showSearchPanel={false}
          tableKey="sales"
          datasetColumns={datasetColumns}
          columnConfigs={EMPTY_COLUMN_CONFIGS}
          records={data.records}
          sortedRecordIds={pageIds}
          shimmer={false}
          itemsLoading={false}
          selectionType={SelectionMode.none}
          selection={selection}
        onNavigate={() => undefined}
        onSort={onSort}
        sorting={sortedCol ? ([{ name: sortedCol, sortDirection: sortedDesc ? 1 : 0 }] as ComponentFramework.PropertyHelper.DataSetApi.SortStatus[]) : ([] as ComponentFramework.PropertyHelper.DataSetApi.SortStatus[])}
        componentRef={componentRef as unknown as IRefObject<IDetailsList>}
        resources={dummyResources}
        onSearch={() => handleSearch()}
        onColumnFiltersChange={(f) => {
          setHeaderFilters(f as Record<string, ColumnFilterValue>);
          // apply immediately
          handleSearch();
        }}
        columnFilters={headerFilters}
        onLoadFilterOptions={onLoadFilterOptions}
        onNextPage={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
        onSetPage={(p) => setPage(p)}
          currentPage={page}
          totalPages={totalPages}
          canNext={page < totalPages - 1}
          canPrev={page > 0}
          searchFilters={filters}
          showResults
          isHeaderVisible
        />
      )}
    </Stack>
  );
}
