import * as React from 'react';
import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  SelectionMode,
  Spinner,
  Stack,
  Text,
  TextField,
  DefaultButton,
} from '@fluentui/react';
import { DetailsListHost } from '../DetailsListHost/DetailsListHost';
import { PCFContext } from '../context/PCFContext';
import { IInputs } from '../../generated/ManifestTypes';
import { logPerf } from '../../utils/Perf';

interface StatutorySpatialUnitLabel {
  statutorySpatialUnitLabelId: string;
  statutorySpatialUnitId: string;
  effectiveFromDate: string;
  effectiveToDate: string | null;
  addressString: string;
  labelStatusId: string;
  prevLabelVersionId: string | null;
  nextLabelversionId: string | null;
  isPrimaryLabel: boolean;
  labelSourceId: string;
  voaSsuDescription: string | null;
  accessDescription: string | null;
  uprn: number | string | null;
  uprnParent: string | null;
  voauprn: string | null;
  is8s7666Compliant: boolean | null;
  osopa: string | null;
  firmOrOccupier: string | null;
  buildingName: string | null;
  buildingNumber: string | null;
  street: string | null;
  locality: string | null;
  town: string | null;
  postcode: string | null;
  county: string | null;
  country: string | null;
  lpiAdministrativeArea: string | null;
  lpiPostcodeLocator: string | null;
  lpiLastUpdateDate?: string | null;
  createdDate?: string | null;
  [key: string]: unknown;
}

interface StatutorySpatialUnitResponse {
  results?: StatutorySpatialUnitLabel[];
  moreResultsAvailable?: boolean;
  page?: number;
}

interface FilterState {
  postcode: string;
  street: string;
  town: string;
  bacode: string;
}

// Endpoint path is case‑sensitive in some gateways; use the lowercase variant required by the API
const API_URL = '/v1/statutoryspatialunitlabeladdressquery';

const DEFAULT_HEADERS = new Headers({
  ActiveDirectoryObjectId: '',
  CorrelationId: '',
  CaseObjectType: '',
  CaseObjectId: '',
  'ocp-apim-subscription-key': '',
});

const defaultFilters: FilterState = {
  postcode: '',
  street: '',
  town: '',
  bacode: '',
};

const stackTokens = { childrenGap: 16 };
const rowStackTokens = { childrenGap: 12 };
const columnWidth = 180;

export const StatutorySpatialUnitBrowser: React.FC = () => {
  const context = React.useContext(PCFContext);
  const [filters, setFilters] = React.useState<FilterState>({ ...defaultFilters });
  const [items, setItems] = React.useState<StatutorySpatialUnitLabel[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [hasSearched, setHasSearched] = React.useState(false);
  const [moreResultsAvailable, setMoreResultsAvailable] = React.useState(false);
  const lastHeaderFiltersRef = React.useRef<Record<string, string | string[]>>({});
  const inFlightKeyRef = React.useRef<string | undefined>(undefined);

  const onFilterChange = React.useCallback((key: keyof FilterState, value?: string) => {
    setFilters((prev) => ({ ...prev, [key]: value ?? '' }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters({ ...defaultFilters });
    setItems([]);
    setHasSearched(false);
    setMoreResultsAvailable(false);
    setError(undefined);
  }, []);

  const columns = React.useMemo<IColumn[]>(
    () => [
      {
        key: 'addressString',
        name: 'Address',
        fieldName: 'addressString',
        minWidth: 240,
        maxWidth: 360,
        isResizable: true,
      },
      {
        key: 'buildingNumber',
        name: 'Building No.',
        fieldName: 'buildingNumber',
        minWidth: 90,
        maxWidth: 120,
        isResizable: true,
      },
      {
        key: 'street',
        name: 'Street',
        fieldName: 'street',
        minWidth: columnWidth,
        maxWidth: columnWidth,
        isResizable: false,
      },
      {
        key: 'town',
        name: 'Town',
        fieldName: 'town',
        minWidth: columnWidth,
        isResizable: true,
      },
      {
        key: 'postcode',
        name: 'Postcode',
        fieldName: 'postcode',
        minWidth: 120,
        isResizable: true,
      },
      {
        key: 'uprn',
        name: 'UPRN',
        fieldName: 'uprn',
        minWidth: columnWidth,
        isResizable: true,
      },
      {
        key: 'isPrimaryLabel',
        name: 'Primary Label',
        fieldName: 'isPrimaryLabel',
        minWidth: 120,
        isResizable: true,
        onRender: (item?: StatutorySpatialUnitLabel) => (item?.isPrimaryLabel ? 'Yes' : 'No'),
      },
      {
        key: 'effectiveFromDate',
        name: 'Effective From',
        fieldName: 'effectiveFromDate',
        minWidth: columnWidth,
        isResizable: true,
      },
      {
        key: 'lpiAdministrativeArea',
        name: 'Administrative Area',
        fieldName: 'lpiAdministrativeArea',
        minWidth: columnWidth,
        isResizable: true,
      },
      {
        key: 'lpiPostcodeLocator',
        name: 'Postcode Locator',
        fieldName: 'lpiPostcodeLocator',
        minWidth: columnWidth,
        isResizable: true,
      },
    ],
    [],
  );

  const buildQueryString = React.useCallback((state: FilterState, extra?: { street?: string; town?: string }) => {
    const params = new URLSearchParams();
    const pc = state.postcode?.trim();
    if (pc) params.append('postcode', pc);
    if (extra?.street) params.append('street', extra.street);
    if (extra?.town) params.append('town', extra.town);
    return params.toString();
  }, []);

  const fetchResults = React.useCallback(async (extra?: { street?: string; town?: string }) => {
    setIsLoading(true);
    setError(undefined);
    setHasSearched(true);

    try {
      const query = buildQueryString(filters, extra);
      const url = query ? `${API_URL}?${query}` : API_URL;

      const t0 = performance.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: DEFAULT_HEADERS,
      });
      const t1 = performance.now();
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const t2 = performance.now();
      const data = (await response.json()) as StatutorySpatialUnitResponse;
      const t3 = performance.now();
      const results = Array.isArray(data?.results) ? data.results : [];
      setItems(results);
      setMoreResultsAvailable(Boolean(data?.moreResultsAvailable));
      logPerf('[SSU Perf] API URL:', url);
      logPerf('[SSU Perf] Network+server time (ms):', Math.round(t1 - t0));
      logPerf('[SSU Perf] Time to first byte to JSON start (ms):', Math.round(t2 - t1));
      logPerf('[SSU Perf] JSON parse time (ms):', Math.round(t3 - t2));
      logPerf('[SSU Perf] Items returned:', results.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error calling VOA API';
      setError(message);
      setItems([]);
      setMoreResultsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString, filters]);

  const onHeaderFiltersApply = React.useCallback((header: Record<string, string | string[]>) => {
    // De-dupe: skip if identical to last applied
    const prev = lastHeaderFiltersRef.current;
    const same = (() => {
      const aKeys = Object.keys(prev).sort();
      const bKeys = Object.keys(header).sort();
      if (aKeys.length !== bKeys.length) return false;
      for (let i = 0; i < aKeys.length; i++) {
        if (aKeys[i] !== bKeys[i]) return false;
        const av = prev[aKeys[i]];
        const bv = header[bKeys[i]];
        if (Array.isArray(av) || Array.isArray(bv)) {
          const aa = Array.isArray(av) ? av : [String(av ?? '')];
          const bb = Array.isArray(bv) ? bv : [String(bv ?? '')];
          if (aa.length !== bb.length) return false;
          for (let j = 0; j < aa.length; j++) if (String(aa[j]) !== String(bb[j])) return false;
        } else if (String(av ?? '') !== String(bv ?? '')) {
          return false;
        }
      }
      return true;
    })();
    if (same) return;
    lastHeaderFiltersRef.current = header;

    if (!moreResultsAvailable) return;
    const valOf = (k: string): string => {
      const v = header[k];
      if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter((s) => s !== '').join(',');
      return (v ?? '').toString().trim();
    };
    const street = valOf('street');
    const town = valOf('town');
    if (!street && !town) return;
    const q = buildQueryString(filters, { street: street || undefined, town: town || undefined });
    if (inFlightKeyRef.current === q) return; // de-dupe same query in-flight
    inFlightKeyRef.current = q;
    void (async () => {
      try {
        await fetchResults({ street: street || undefined, town: town || undefined });
      } finally {
        inFlightKeyRef.current = undefined;
      }
    })();
  }, [buildQueryString, fetchResults, filters, moreResultsAvailable]);

  return (
    <Stack tokens={stackTokens} styles={{ root: { marginTop: 24 } }}>
      <Text variant="xLarge">Statutory Spatial Unit Lookup</Text>
      <Stack horizontal wrap tokens={rowStackTokens}>
        <TextField
          label="Postcode"
          value={filters.postcode}
          onChange={(_, value) => onFilterChange('postcode', value)}
          styles={{ root: { maxWidth: 220 } }}
        />
        <TextField
          label="Street"
          value={filters.street}
          onChange={(_, value) => onFilterChange('street', value)}
          styles={{ root: { maxWidth: 220 } }}
        />
        <TextField
          label="Town"
          value={filters.town}
          onChange={(_, value) => onFilterChange('town', value)}
          styles={{ root: { maxWidth: 220 } }}
        />
        <TextField
          label="BA Code"
          value={filters.bacode}
          onChange={(_, value) => onFilterChange('bacode', value)}
          styles={{ root: { maxWidth: 220 } }}
        />
      </Stack>
      <Stack horizontal tokens={rowStackTokens}>
        <PrimaryButton text="Search" onClick={() => void fetchResults()} disabled={isLoading} />
        <DefaultButton text="Reset" onClick={resetFilters} disabled={isLoading} />
      </Stack>
      {error && (
        <MessageBar messageBarType={MessageBarType.error} isMultiline>
          {error}
        </MessageBar>
      )}
      {isLoading ? (
        <Spinner label="Loading statutory spatial unit labels..." />
      ) : (
        // Render only the enhanced grid with header filters
        <Stack tokens={{ childrenGap: 12 }}>
          {context ? (
            <DetailsListHost
              context={context}
              externalItems={items}
              onColumnFiltersApply={onHeaderFiltersApply}
            />
          ) : null}
        </Stack>
      )}
      {hasSearched && !isLoading && !error && (
        <Text variant="smallPlus">
          {items.length === 0
            ? 'No records returned for the selected filters.'
            : `${items.length} record${items.length === 1 ? '' : 's'} returned${
                moreResultsAvailable ? ' (more results are available in the service).' : '.'
              }`}
        </Text>
      )}
      {/* Only the DetailsListHost grid is shown above; no duplicate list here */}
    </Stack>
  );
};
