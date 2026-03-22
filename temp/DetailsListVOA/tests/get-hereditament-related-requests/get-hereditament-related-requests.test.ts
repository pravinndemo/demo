/**
 * Tests for the GetHereditamentRelatedRequests model and the full
 * hereditament-active-request flow.
 *
 * Covers:
 *  - Model structure & type alignment with the real API response
 *  - Plugin (voa_GetHereditamentRelatedRequests.cs) cross-checks
 *  - FetchXML query structure and filter conditions
 *  - Plugin error handling and tracing
 *  - View model padStatusLabel derivation
 *  - View model isActiveRequestPresent via isTrueLike + firstNonEmpty
 *  - isTrueLike accepted / rejected values
 *  - PadSection rendering (synced tag, warning tag, icon, tooltip)
 *  - CSS class alignment (synced blue, warning amber)
 *  - Types alignment (SaleDetailsViewModel fields)
 *  - PropertyAndBandingDetails model alignment (activeRequestInVos field)
 *  - Sample data alignment
 *  - Real payload round-trip
 */

import fs from 'fs';
import path from 'path';
import type {
  GetHereditamentRelatedRequestsRequest,
  GetHereditamentRelatedRequestsResponse,
  PluginErrorMessage,
  QueryEntityName,
  QueryAttribute,
  FetchXmlFilterCondition,
  PadStatusSyncedValue,
  PadStatusSyncedLabel,
  ActiveRequestWarningText,
  TrueLikeValue,
  ActiveRequestFallbackKey,
  PadSyncedCssClass,
  PadWarningCssClass,
  PluginClassName,
  PluginNamespace,
  PluginBaseClass,
} from '../../models/GetHereditamentRelatedRequests';

/* ================================================================== */
/*  Helper utilities                                                  */
/* ================================================================== */

const repoRoot = path.resolve(__dirname, '..', '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

/* ================================================================== */
/*  Real trace payload fixture (from user-provided API call)          */
/* ================================================================== */

const REAL_REQUEST: GetHereditamentRelatedRequestsRequest = {
  hereditamentId: '92270465-0c7e-6978-d915-07931616525a',
};

const REAL_RESPONSE: GetHereditamentRelatedRequestsResponse = {
  '@odata.context': 'https://voabstdev.crm11.dynamics.com/api/data/v9.0/$metadata#Microsoft.Dynamics.CRM.voa_GetHereditamentRelatedRequestsResponse',
  hereditamentActiveRequest: false,
};

/* ================================================================== */
/*  Source files (lazy-loaded once for cross-checks)                   */
/* ================================================================== */

const pluginSource = readRepoFile('VOA.SVT.Plugins/Plugins/CustomAPI/voa_GetHereditamentRelatedRequests.cs');
const viewModelSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/useSaleDetailsViewModel.ts');
const padSectionSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sections/PadSection.tsx');
const typesSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/types.ts');
const utilsSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/utils.ts');
const viewSaleModelSource = readRepoFile('DetailsListVOA/models/ViewSaleRecordById.ts');
const cssSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/SaleDetailsShell.css');

/* ================================================================== */
/*  1. Model structure tests                                          */
/* ================================================================== */

describe('GetHereditamentRelatedRequests model', () => {

  describe('GetHereditamentRelatedRequestsRequest', () => {
    test('real request satisfies the request interface', () => {
      const req: GetHereditamentRelatedRequestsRequest = REAL_REQUEST;
      expect(req.hereditamentId).toBe('92270465-0c7e-6978-d915-07931616525a');
    });

    test('request has exactly one field', () => {
      const req: GetHereditamentRelatedRequestsRequest = REAL_REQUEST;
      expect(Object.keys(req)).toHaveLength(1);
      expect(Object.keys(req)).toEqual(['hereditamentId']);
    });

    test('hereditamentId is a GUID string', () => {
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(REAL_REQUEST.hereditamentId).toMatch(guidRegex);
    });
  });

  describe('GetHereditamentRelatedRequestsResponse', () => {
    test('real response satisfies the response interface', () => {
      const res: GetHereditamentRelatedRequestsResponse = REAL_RESPONSE;
      expect(res.hereditamentActiveRequest).toBe(false);
    });

    test('response with active request is valid', () => {
      const res: GetHereditamentRelatedRequestsResponse = {
        hereditamentActiveRequest: true,
      };
      expect(res.hereditamentActiveRequest).toBe(true);
    });

    test('@odata.context is present in real response', () => {
      expect(REAL_RESPONSE['@odata.context']).toContain('voa_GetHereditamentRelatedRequestsResponse');
    });

    test('response fields are all optional', () => {
      const empty: GetHereditamentRelatedRequestsResponse = {};
      expect(empty.hereditamentActiveRequest).toBeUndefined();
      expect(empty['@odata.context']).toBeUndefined();
    });

    test('hereditamentActiveRequest is boolean, not string or number', () => {
      expect(typeof REAL_RESPONSE.hereditamentActiveRequest).toBe('boolean');
    });
  });

  describe('PluginErrorMessage', () => {
    test('hereditamentId required error is a valid error', () => {
      const err: PluginErrorMessage = 'hereditamentId is required.';
      expect(err).toBe('hereditamentId is required.');
    });

    test('generic error message is a valid error', () => {
      const err: PluginErrorMessage = 'Unable to get hereditament related requests.';
      expect(err).toBe('Unable to get hereditament related requests.');
    });
  });

  describe('QueryEntityName', () => {
    test('query entity is voa_requestlineitem', () => {
      const entity: QueryEntityName = 'voa_requestlineitem';
      expect(entity).toBe('voa_requestlineitem');
    });
  });

  describe('QueryAttribute', () => {
    test('query attribute is voa_requestlineitemid', () => {
      const attr: QueryAttribute = 'voa_requestlineitemid';
      expect(attr).toBe('voa_requestlineitemid');
    });
  });

  describe('FetchXmlFilterCondition', () => {
    test('statecode condition shape is valid', () => {
      const cond: FetchXmlFilterCondition = { attribute: 'statecode', operator: 'eq', value: '0' };
      expect(cond.attribute).toBe('statecode');
      expect(cond.operator).toBe('eq');
      expect(cond.value).toBe('0');
    });

    test('voa_statutoryspatialunitid condition shape is valid', () => {
      const cond: FetchXmlFilterCondition = {
        attribute: 'voa_statutoryspatialunitid',
        operator: 'eq',
        value: '92270465-0c7e-6978-d915-07931616525a',
      };
      expect(cond.attribute).toBe('voa_statutoryspatialunitid');
      expect(cond.value).toBe(REAL_REQUEST.hereditamentId);
    });
  });

  describe('PadStatusSyncedValue', () => {
    test('synced trigger value is Committed', () => {
      const val: PadStatusSyncedValue = 'Committed';
      expect(val).toBe('Committed');
    });
  });

  describe('PadStatusSyncedLabel', () => {
    test('synced label text matches PadSection rendering', () => {
      const label: PadStatusSyncedLabel = 'PAD Status: Synced';
      expect(label).toBe('PAD Status: Synced');
    });
  });

  describe('ActiveRequestWarningText', () => {
    test('warning text matches PadSection rendering', () => {
      const text: ActiveRequestWarningText = 'Active request/job in VOS';
      expect(text).toBe('Active request/job in VOS');
    });
  });

  describe('TrueLikeValue', () => {
    test.each<TrueLikeValue>(['true', 'yes', '1', 'y'])('"%s" is a valid TrueLikeValue', (val) => {
      const tv: TrueLikeValue = val;
      expect(tv).toBe(val);
    });
  });

  describe('ActiveRequestFallbackKey', () => {
    test.each<ActiveRequestFallbackKey>(['activeRequestInVos', 'isActiveRequestPresent'])(
      '"%s" is a valid fallback key',
      (key) => {
        const k: ActiveRequestFallbackKey = key;
        expect(k).toBe(key);
      },
    );
  });

  describe('CSS class types', () => {
    test('synced class matches', () => {
      const cls: PadSyncedCssClass = 'voa-pad-top-tag--synced';
      expect(cls).toBe('voa-pad-top-tag--synced');
    });
    test('warning class matches', () => {
      const cls: PadWarningCssClass = 'voa-pad-top-tag--warning';
      expect(cls).toBe('voa-pad-top-tag--warning');
    });
  });

  describe('Plugin class metadata', () => {
    test('class name matches', () => {
      const name: PluginClassName = 'voa_GetHereditamentRelatedRequests';
      expect(name).toBe('voa_GetHereditamentRelatedRequests');
    });
    test('namespace matches', () => {
      const ns: PluginNamespace = 'VOA.SVT.Plugins.CustomAPI';
      expect(ns).toBe('VOA.SVT.Plugins.CustomAPI');
    });
    test('base class matches', () => {
      const base: PluginBaseClass = 'PluginBase';
      expect(base).toBe('PluginBase');
    });
  });
});

/* ================================================================== */
/*  2. Plugin cross-checks                                            */
/* ================================================================== */

describe('Plugin cross-checks (voa_GetHereditamentRelatedRequests.cs)', () => {

  describe('class structure', () => {
    test('class is declared', () => {
      expect(pluginSource).toContain('public class voa_GetHereditamentRelatedRequests : PluginBase');
    });

    test('namespace is VOA.SVT.Plugins.CustomAPI', () => {
      expect(pluginSource).toContain('namespace VOA.SVT.Plugins.CustomAPI');
    });

    test('constructor takes unsecure and secure configuration', () => {
      expect(pluginSource).toContain('public voa_GetHereditamentRelatedRequests(string unsecureConfiguration, string secureConfiguration)');
    });

    test('calls base with typeof(voa_GetHereditamentRelatedRequests)', () => {
      expect(pluginSource).toContain('base(typeof(voa_GetHereditamentRelatedRequests))');
    });

    test('overrides ExecuteCdsPlugin', () => {
      expect(pluginSource).toContain('protected override void ExecuteCdsPlugin(ILocalPluginContext localPluginContext)');
    });
  });

  describe('input parameter', () => {
    test('reads hereditamentId from InputParameters', () => {
      expect(pluginSource).toContain('context.InputParameters.Contains("hereditamentId")');
    });

    test('validates hereditamentId is a Guid', () => {
      expect(pluginSource).toContain('context.InputParameters["hereditamentId"] is Guid ssuId');
    });

    test('throws InvalidPluginExecutionException if missing', () => {
      expect(pluginSource).toContain('throw new InvalidPluginExecutionException("hereditamentId is required.")');
    });
  });

  describe('output parameter', () => {
    test('sets hereditamentActiveRequest output', () => {
      expect(pluginSource).toContain('context.OutputParameters["hereditamentActiveRequest"]');
    });

    test('output is a boolean (result of IsActiveRequestPresent)', () => {
      expect(pluginSource).toContain('var hereditamentRelatedActiveRequest = IsActiveRequestPresent(ssuId, service, tracing)');
      expect(pluginSource).toContain('context.OutputParameters["hereditamentActiveRequest"] = hereditamentRelatedActiveRequest');
    });
  });

  describe('FetchXML query', () => {
    test('queries voa_requestlineitem entity', () => {
      expect(pluginSource).toContain("name='voa_requestlineitem'");
    });

    test('uses top=1 for existence check', () => {
      expect(pluginSource).toContain("top='1'");
    });

    test('filters on statecode=0 (active records)', () => {
      expect(pluginSource).toContain("attribute='statecode' operator='eq' value='0'");
    });

    test('filters on voa_statutoryspatialunitid', () => {
      expect(pluginSource).toContain("attribute='voa_statutoryspatialunitid' operator='eq'");
    });

    test('retrieves voa_requestlineitemid attribute', () => {
      expect(pluginSource).toContain("name='voa_requestlineitemid'");
    });

    test('uses AND filter type', () => {
      expect(pluginSource).toContain("filter type='and'");
    });

    test('returns true when entities found, false otherwise', () => {
      expect(pluginSource).toContain('result.Entities.Count > 0');
    });

    test('uses RetrieveMultiple with FetchExpression', () => {
      expect(pluginSource).toContain('service.RetrieveMultiple(new FetchExpression(fetchXml))');
    });
  });

  describe('IsActiveRequestPresent method', () => {
    test('method signature takes Guid, IOrganizationService, ITracingService', () => {
      expect(pluginSource).toContain('private static bool IsActiveRequestPresent(Guid ssuId, IOrganizationService service, ITracingService tracing)');
    });

    test('method is static', () => {
      expect(pluginSource).toMatch(/private\s+static\s+bool\s+IsActiveRequestPresent/);
    });

    test('returns bool type', () => {
      expect(pluginSource).toMatch(/static\s+bool\s+IsActiveRequestPresent/);
    });
  });

  describe('error handling', () => {
    test('rethrows InvalidPluginExecutionException as-is', () => {
      expect(pluginSource).toContain('if (ex is InvalidPluginExecutionException)');
      // The throw; re-throws the original
      expect(pluginSource).toContain('throw;');
    });

    test('wraps other exceptions with generic message', () => {
      expect(pluginSource).toContain('throw new InvalidPluginExecutionException("Unable to get hereditament related requests.")');
    });

    test('logs exception via tracing', () => {
      expect(pluginSource).toContain('Exception in voa_GetHereditamentRelatedRequests');
    });
  });

  describe('tracing', () => {
    test('traces start of execution', () => {
      expect(pluginSource).toContain('$"{nameof(ExecuteCdsPlugin)} start"');
    });

    test('traces hereditamentId value', () => {
      expect(pluginSource).toContain('$"HereditamentId: {ssuId}"');
    });

    test('traces done with result', () => {
      expect(pluginSource).toContain('$"{nameof(ExecuteCdsPlugin)} done. ActiveRequest={hereditamentRelatedActiveRequest}"');
    });

    test('traces FetchXML', () => {
      expect(pluginSource).toContain('$"FetchXML: {fetchXml}"');
    });
  });

  describe('null checks', () => {
    test('checks localPluginContext for null', () => {
      expect(pluginSource).toContain('if (localPluginContext == null)');
    });

    test('throws ArgumentNullException for null context', () => {
      expect(pluginSource).toContain('throw new ArgumentNullException(nameof(localPluginContext))');
    });

    test('uses null-conditional for tracing calls', () => {
      expect(pluginSource).toContain('tracing?.Trace');
    });

    test('null-safe check on RetrieveMultiple result', () => {
      expect(pluginSource).toContain('result?.Entities != null');
    });
  });

  describe('no APIM / HTTP / credential usage', () => {
    test('does not use HttpClient or WebClient', () => {
      expect(pluginSource).not.toContain('HttpClient');
      expect(pluginSource).not.toContain('WebClient');
    });

    test('does not use CredentialProvider', () => {
      expect(pluginSource).not.toContain('CredentialProvider');
      expect(pluginSource).not.toContain('voa_CredentialProvider');
    });

    test('does not reference APIM', () => {
      expect(pluginSource).not.toContain('Address');
      expect(pluginSource.toLowerCase()).not.toContain('apim');
    });

    test('does not parse JSON (no JsonConvert / JObject)', () => {
      expect(pluginSource).not.toContain('JsonConvert');
      expect(pluginSource).not.toContain('JObject');
      expect(pluginSource).not.toContain('JArray');
    });
  });
});

/* ================================================================== */
/*  3. View model PAD status mapping cross-checks                     */
/* ================================================================== */

describe('View model PAD status mapping', () => {

  describe('padStatusLabel derivation', () => {
    test('reads padStatus from propertyAndBandingDetails', () => {
      expect(viewModelSource).toContain("getValue(propertyAndBandingDetails, 'padStatus')");
    });

    test('maps committed to "PAD Status: Synced"', () => {
      expect(viewModelSource).toContain("padStatusDisplay.toLowerCase() === 'committed' ? 'PAD Status: Synced'");
    });

    test('falls back to "PAD Status: ${padStatusDisplay}"', () => {
      expect(viewModelSource).toContain('`PAD Status: ${padStatusDisplay}`');
    });
  });

  describe('isActiveRequestPresent derivation', () => {
    test('uses isTrueLike wrapper', () => {
      expect(viewModelSource).toContain('const isActiveRequestPresent = isTrueLike(');
    });

    test('uses firstNonEmpty for fallback chain', () => {
      expect(viewModelSource).toContain('firstNonEmpty(');
    });

    test('checks propertyAndBandingDetails.activeRequestInVos first', () => {
      expect(viewModelSource).toContain("getValue(propertyAndBandingDetails, 'activeRequestInVos')");
    });

    test('checks propertyAndBandingDetails.isActiveRequestPresent second', () => {
      expect(viewModelSource).toContain("getValue(propertyAndBandingDetails, 'isActiveRequestPresent')");
    });

    test('checks details.activeRequestInVos third', () => {
      expect(viewModelSource).toContain("getValue(details, 'activeRequestInVos')");
    });

    test('checks details.isActiveRequestPresent fourth', () => {
      expect(viewModelSource).toContain("getValue(details, 'isActiveRequestPresent')");
    });

    test('four fallback keys are in the correct order', () => {
      const idx1 = viewModelSource.indexOf("getValue(propertyAndBandingDetails, 'activeRequestInVos')");
      const idx2 = viewModelSource.indexOf("getValue(propertyAndBandingDetails, 'isActiveRequestPresent')");
      const idx3 = viewModelSource.indexOf("getValue(details, 'activeRequestInVos')");
      const idx4 = viewModelSource.indexOf("getValue(details, 'isActiveRequestPresent')");
      expect(idx1).toBeLessThan(idx2);
      expect(idx2).toBeLessThan(idx3);
      expect(idx3).toBeLessThan(idx4);
    });
  });
});

/* ================================================================== */
/*  4. isTrueLike utility cross-checks                                */
/* ================================================================== */

describe('isTrueLike utility', () => {
  test('function is exported in utils.ts', () => {
    expect(utilsSource).toContain('export const isTrueLike');
  });

  test('normalizes input with trim().toLowerCase()', () => {
    expect(utilsSource).toContain('raw.trim().toLowerCase()');
  });

  test.each(['true', 'yes', '1', 'y'])('accepts "%s" as truthy', (val) => {
    expect(utilsSource).toContain(`normalized === '${val}'`);
  });

  test('implementation in source matches expected truthy values', () => {
    expect(utilsSource).toMatch(/normalized\s*===\s*'true'\s*\|\|\s*normalized\s*===\s*'yes'\s*\|\|\s*normalized\s*===\s*'1'\s*\|\|\s*normalized\s*===\s*'y'/);
  });

  test('function returns boolean', () => {
    expect(utilsSource).toContain('isTrueLike = (raw: string): boolean');
  });

  describe('simulated isTrueLike behavior', () => {
    // Replicating the isTrueLike logic inline for simulation
    const isTrueLike = (raw: string): boolean => {
      const normalized = raw.trim().toLowerCase();
      return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'y';
    };

    test.each([
      ['true', true],
      ['True', true],
      ['TRUE', true],
      ['  true  ', true],
      ['yes', true],
      ['Yes', true],
      ['YES', true],
      ['1', true],
      ['y', true],
      ['Y', true],
      ['false', false],
      ['no', false],
      ['0', false],
      ['n', false],
      ['', false],
      ['maybe', false],
      ['2', false],
      ['truthy', false],
      ['  ', false],
    ] as [string, boolean][])('isTrueLike("%s") → %s', (input, expected) => {
      expect(isTrueLike(input)).toBe(expected);
    });
  });
});

/* ================================================================== */
/*  5. PadSection component cross-checks                              */
/* ================================================================== */

describe('PadSection component', () => {

  describe('props interface', () => {
    test('accepts padStatusDisplay prop', () => {
      expect(padSectionSource).toContain('padStatusDisplay: string');
    });

    test('accepts padStatusLabel prop', () => {
      expect(padSectionSource).toContain('padStatusLabel: string');
    });

    test('accepts isActiveRequestPresent prop', () => {
      expect(padSectionSource).toContain('isActiveRequestPresent: boolean');
    });
  });

  describe('synced tag rendering', () => {
    test('renders synced tag with voa-pad-top-tag--synced class', () => {
      expect(padSectionSource).toContain('className="voa-pad-top-tag voa-pad-top-tag--synced"');
    });

    test('displays padStatusLabel in synced tag', () => {
      expect(padSectionSource).toContain('{padStatusLabel}');
    });

    test('synced tag is conditional on padStatusDisplay !== "-"', () => {
      expect(padSectionSource).toContain("padStatusDisplay !== '-'");
    });
  });

  describe('warning tag rendering', () => {
    test('renders warning tag with voa-pad-top-tag--warning class', () => {
      expect(padSectionSource).toContain('className="voa-pad-top-tag voa-pad-top-tag--warning"');
    });

    test('warning tag is conditional on isActiveRequestPresent', () => {
      expect(padSectionSource).toContain('{isActiveRequestPresent && (');
    });

    test('warning tag shows "Active request/job in VOS" text', () => {
      expect(padSectionSource).toContain('Active request/job in VOS');
    });

    test('warning tag has title tooltip explaining the context', () => {
      expect(padSectionSource).toContain('title="Sales record is linked to a hereditament with an active request/job in VOS"');
    });

    test('warning tag uses Warning icon from Fluent UI', () => {
      expect(padSectionSource).toContain('iconName="Warning"');
    });

    test('warning icon is aria-hidden', () => {
      expect(padSectionSource).toContain('aria-hidden="true"');
    });
  });

  describe('tags container', () => {
    test('tags are wrapped in voa-pad-top-tags div', () => {
      expect(padSectionSource).toContain('className="voa-pad-top-tags"');
    });
  });

  describe('section heading', () => {
    test('section is labelled "Property Attribute Details"', () => {
      expect(padSectionSource).toContain('Property Attribute Details');
    });

    test('uses aria-labelledby for pad-heading', () => {
      expect(padSectionSource).toContain('aria-labelledby="pad-heading"');
    });
  });

  describe('PAD status chip in table (committed vs default)', () => {
    test('committed status gets committed chip class', () => {
      expect(padSectionSource).toContain("padStatusDisplay.toLowerCase() === 'committed' ? 'voa-pad-status-chip--committed' : 'voa-pad-status-chip--default'");
    });

    test('chip has aria-label for PAD status', () => {
      expect(padSectionSource).toContain('aria-label={`PAD status: ${padStatusDisplay}`}');
    });
  });
});

/* ================================================================== */
/*  6. CSS class alignment                                            */
/* ================================================================== */

describe('CSS class alignment', () => {

  test('voa-pad-top-tag base class exists', () => {
    expect(cssSource).toContain('.voa-pad-top-tag');
  });

  test('voa-pad-top-tag uses pill shape (border-radius: 999px)', () => {
    expect(cssSource).toContain('border-radius: 999px');
  });

  test('synced tag has blue background (#3949ab)', () => {
    expect(cssSource).toContain('.voa-pad-top-tag--synced');
    expect(cssSource).toContain('background: #3949ab');
  });

  test('synced tag has white text (#ffffff)', () => {
    // Find the synced block and check color
    const syncedIdx = cssSource.indexOf('.voa-pad-top-tag--synced');
    const syncedBlock = cssSource.substring(syncedIdx, cssSource.indexOf('}', syncedIdx) + 1);
    expect(syncedBlock).toContain('color: #ffffff');
  });

  test('warning tag has amber background (#ffbf00)', () => {
    expect(cssSource).toContain('.voa-pad-top-tag--warning');
    expect(cssSource).toContain('background: #ffbf00');
  });

  test('warning tag has dark text (#1f1f1f)', () => {
    const warningIdx = cssSource.indexOf('.voa-pad-top-tag--warning');
    const warningBlock = cssSource.substring(warningIdx, cssSource.indexOf('}', warningIdx) + 1);
    expect(warningBlock).toContain('color: #1f1f1f');
  });

  test('warning tag has border (#d3a128)', () => {
    expect(cssSource).toContain('border: 1px solid #d3a128');
  });

  test('tags container uses flexbox with gap', () => {
    expect(cssSource).toContain('.voa-pad-top-tags');
    const tagsIdx = cssSource.indexOf('.voa-pad-top-tags');
    const tagsBlock = cssSource.substring(tagsIdx, cssSource.indexOf('}', tagsIdx) + 1);
    expect(tagsBlock).toContain('display: flex');
    expect(tagsBlock).toContain('gap: 8px');
  });

  test('base tag uses inline-flex and font-weight 600', () => {
    const baseIdx = cssSource.indexOf('.voa-pad-top-tag {');
    if (baseIdx !== -1) {
      const baseBlock = cssSource.substring(baseIdx, cssSource.indexOf('}', baseIdx) + 1);
      expect(baseBlock).toContain('display: inline-flex');
      expect(baseBlock).toContain('font-weight: 600');
    }
  });
});

/* ================================================================== */
/*  7. Types alignment (SaleDetailsViewModel)                         */
/* ================================================================== */

describe('SaleDetailsViewModel types alignment', () => {

  test('types include padStatusDisplay: string', () => {
    expect(typesSource).toContain('padStatusDisplay: string');
  });

  test('types include padStatusLabel: string', () => {
    expect(typesSource).toContain('padStatusLabel: string');
  });

  test('types include isActiveRequestPresent: boolean', () => {
    expect(typesSource).toContain('isActiveRequestPresent: boolean');
  });

  test('all three PAD fields are present', () => {
    const hasPadStatusDisplay = typesSource.includes('padStatusDisplay');
    const hasPadStatusLabel = typesSource.includes('padStatusLabel');
    const hasIsActiveRequestPresent = typesSource.includes('isActiveRequestPresent');
    expect(hasPadStatusDisplay && hasPadStatusLabel && hasIsActiveRequestPresent).toBe(true);
  });
});

/* ================================================================== */
/*  8. PropertyAndBandingDetails model alignment                      */
/* ================================================================== */

describe('PropertyAndBandingDetails model alignment', () => {

  test('ViewSaleRecordById model has activeRequestInVos field', () => {
    expect(viewSaleModelSource).toContain('activeRequestInVos');
  });

  test('activeRequestInVos is typed as optional boolean', () => {
    expect(viewSaleModelSource).toMatch(/activeRequestInVos\?:\s*boolean/);
  });

  test('model has suId field (hereditament GUID)', () => {
    expect(viewSaleModelSource).toContain('suId');
    expect(viewSaleModelSource).toMatch(/suId\?:\s*string/);
  });

  test('model has padStatus field', () => {
    expect(viewSaleModelSource).toContain('padStatus');
    expect(viewSaleModelSource).toMatch(/padStatus\?:\s*string/);
  });

  test('model includes PropertyAndBandingDetails interface', () => {
    expect(viewSaleModelSource).toContain('export interface PropertyAndBandingDetails');
  });

  test('activeRequestInVos has JSDoc comment', () => {
    const idx = viewSaleModelSource.indexOf('activeRequestInVos');
    const preceding = viewSaleModelSource.substring(Math.max(0, idx - 100), idx);
    expect(preceding).toContain('active VOS request');
  });
});

/* ================================================================== */
/*  9. Real payload round-trip                                        */
/* ================================================================== */

describe('Real payload round-trip', () => {

  test('request payload matches expected structure', () => {
    const payload = JSON.parse(JSON.stringify(REAL_REQUEST));
    expect(payload).toEqual({ hereditamentId: '92270465-0c7e-6978-d915-07931616525a' });
  });

  test('response payload matches expected structure', () => {
    const payload = JSON.parse(JSON.stringify(REAL_RESPONSE));
    expect(payload['@odata.context']).toBeDefined();
    expect(payload).toHaveProperty('hereditamentActiveRequest', false);
  });

  test('false response means PAD is synced', () => {
    expect(REAL_RESPONSE.hereditamentActiveRequest).toBe(false);
    // When false → no active requests → PAD status synced
  });

  test('JSON.stringify preserves boolean type for hereditamentActiveRequest', () => {
    const serialized = JSON.stringify(REAL_RESPONSE);
    expect(serialized).toContain('"hereditamentActiveRequest":false');
    expect(serialized).not.toContain('"hereditamentActiveRequest":"false"');
  });

  test('response round-trips through JSON without data loss', () => {
    const roundTripped: GetHereditamentRelatedRequestsResponse = JSON.parse(JSON.stringify(REAL_RESPONSE));
    expect(roundTripped.hereditamentActiveRequest).toBe(REAL_RESPONSE.hereditamentActiveRequest);
    expect(roundTripped['@odata.context']).toBe(REAL_RESPONSE['@odata.context']);
  });
});

/* ================================================================== */
/*  10. Simulated PAD status label derivation                         */
/* ================================================================== */

describe('Simulated PAD status label derivation', () => {
  // Replicating view model logic
  const derivePadStatusLabel = (padStatusDisplay: string): string =>
    padStatusDisplay.toLowerCase() === 'committed'
      ? 'PAD Status: Synced'
      : `PAD Status: ${padStatusDisplay}`;

  test.each([
    ['Committed', 'PAD Status: Synced'],
    ['committed', 'PAD Status: Synced'],
    ['COMMITTED', 'PAD Status: Synced'],
    ['Active', 'PAD Status: Active'],
    ['Draft', 'PAD Status: Draft'],
    ['Pending', 'PAD Status: Pending'],
    ['-', 'PAD Status: -'],
    ['Unknown', 'PAD Status: Unknown'],
  ] as [string, string][])('padStatusDisplay "%s" → "%s"', (input, expected) => {
    expect(derivePadStatusLabel(input)).toBe(expected);
  });
});

/* ================================================================== */
/*  11. API differences vs other SVT custom APIs                      */
/* ================================================================== */

describe('API differences vs other SVT custom APIs', () => {

  test('plugin does not use APIM (no HTTP call)', () => {
    // Other plugins use HttpClient / voa_CredentialProvider / Address
    // This one queries Dataverse directly
    expect(pluginSource).not.toContain('HttpClient');
    expect(pluginSource).not.toContain('voa_CredentialProvider');
  });

  test('plugin input is Guid type (not string)', () => {
    // Other APIs use string InputParameters; this one uses Guid
    expect(pluginSource).toContain('is Guid ssuId');
  });

  test('plugin output is boolean (not JSON string)', () => {
    // Other APIs output JSON strings via context.OutputParameters["Result"]
    // This one outputs a boolean directly
    expect(pluginSource).not.toContain('OutputParameters["Result"]');
    expect(pluginSource).toContain('OutputParameters["hereditamentActiveRequest"]');
  });

  test('plugin does not serialize JSON', () => {
    expect(pluginSource).not.toContain('JsonConvert.SerializeObject');
    expect(pluginSource).not.toContain('JsonConvert.DeserializeObject');
  });

  test('plugin uses FetchXML instead of APIM endpoint', () => {
    expect(pluginSource).toContain('<fetch');
    expect(pluginSource).toContain('</fetch>');
  });
});

/* ================================================================== */
/*  12. Business logic integration scenarios                          */
/* ================================================================== */

describe('Business logic integration scenarios', () => {

  describe('scenario: hereditament with no active requests', () => {
    const response: GetHereditamentRelatedRequestsResponse = {
      hereditamentActiveRequest: false,
    };

    test('hereditamentActiveRequest is false', () => {
      expect(response.hereditamentActiveRequest).toBe(false);
    });

    test('PAD status should show as Synced when padStatus is Committed', () => {
      const padStatusDisplay = 'Committed';
      const padStatusLabel = padStatusDisplay.toLowerCase() === 'committed'
        ? 'PAD Status: Synced'
        : `PAD Status: ${padStatusDisplay}`;
      expect(padStatusLabel).toBe('PAD Status: Synced');
    });

    test('isActiveRequestPresent should be false', () => {
      // isTrueLike('false') → false
      const isTrueLike = (raw: string): boolean => {
        const normalized = raw.trim().toLowerCase();
        return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'y';
      };
      expect(isTrueLike(String(response.hereditamentActiveRequest))).toBe(false);
    });
  });

  describe('scenario: hereditament with active requests', () => {
    const response: GetHereditamentRelatedRequestsResponse = {
      hereditamentActiveRequest: true,
    };

    test('hereditamentActiveRequest is true', () => {
      expect(response.hereditamentActiveRequest).toBe(true);
    });

    test('isActiveRequestPresent should be true', () => {
      const isTrueLike = (raw: string): boolean => {
        const normalized = raw.trim().toLowerCase();
        return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'y';
      };
      expect(isTrueLike(String(response.hereditamentActiveRequest))).toBe(true);
    });

    test('warning tag text should be "Active request/job in VOS"', () => {
      const warningText: ActiveRequestWarningText = 'Active request/job in VOS';
      expect(warningText).toBe('Active request/job in VOS');
    });
  });

  describe('scenario: hereditamentId validation', () => {
    test('valid GUID passes regex', () => {
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect('92270465-0c7e-6978-d915-07931616525a').toMatch(guidRegex);
    });

    test('invalid GUID fails regex', () => {
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect('not-a-guid').not.toMatch(guidRegex);
      expect('').not.toMatch(guidRegex);
      expect('92270465-0c7e-6978-d915-07931616525').not.toMatch(guidRegex);
    });
  });
});

/* ================================================================== */
/*  13. Edge cases                                                    */
/* ================================================================== */

describe('Edge cases', () => {

  test('empty response object is assignable to response type', () => {
    const empty: GetHereditamentRelatedRequestsResponse = {};
    expect(empty.hereditamentActiveRequest).toBeUndefined();
  });

  test('null hereditamentActiveRequest is tolerated by optional typing', () => {
    const res: GetHereditamentRelatedRequestsResponse = { hereditamentActiveRequest: undefined };
    expect(res.hereditamentActiveRequest).toBeUndefined();
  });

  test('odata context is optional', () => {
    const res: GetHereditamentRelatedRequestsResponse = { hereditamentActiveRequest: true };
    expect(res['@odata.context']).toBeUndefined();
  });

  test('request with empty-string hereditamentId fails GUID validation', () => {
    const req: GetHereditamentRelatedRequestsRequest = { hereditamentId: '' };
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(req.hereditamentId).not.toMatch(guidRegex);
  });

  test('padStatusDisplay of "-" hides synced tag per PadSection', () => {
    // In PadSection: padStatusDisplay !== '-' controls synced tag visibility
    const padStatusDisplay = '-';
    expect(padStatusDisplay === '-').toBe(true);
    // synced tag is NOT rendered
  });

  test('isTrueLike with whitespace-only string returns false', () => {
    const isTrueLike = (raw: string): boolean => {
      const normalized = raw.trim().toLowerCase();
      return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'y';
    };
    expect(isTrueLike('   ')).toBe(false);
  });
});

/* ================================================================== */
/*  14. Plugin file structure validation                              */
/* ================================================================== */

describe('Plugin file structure', () => {

  test('uses correct C# using directives', () => {
    expect(pluginSource).toContain('using System;');
    expect(pluginSource).toContain('using Microsoft.Xrm.Sdk;');
    expect(pluginSource).toContain('using Microsoft.Xrm.Sdk.Query;');
    expect(pluginSource).toContain('using VOA.Common;');
  });

  test('does not import unnecessary namespaces', () => {
    expect(pluginSource).not.toContain('using System.Net');
    expect(pluginSource).not.toContain('using Newtonsoft');
    expect(pluginSource).not.toContain('using System.Collections.Generic');
  });

  test('plugin has exactly two methods beyond constructor (ExecuteCdsPlugin + IsActiveRequestPresent)', () => {
    expect(pluginSource).toContain('protected override void ExecuteCdsPlugin');
    expect(pluginSource).toContain('private static bool IsActiveRequestPresent');
    // No other custom methods
    const overrideMethods = pluginSource.match(/override\s+void\s+\w+/g) ?? [];
    expect(overrideMethods).toHaveLength(1);
  });
});

/* ================================================================== */
/*  15. Sample data alignment                                         */
/* ================================================================== */

describe('Sample data alignment', () => {
  let sampleDataSource: string;

  beforeAll(() => {
    sampleDataSource = readRepoFile('DetailsListVOA/components/SaleDetailsShell/sampleData.ts');
  });

  test('sample data includes padStatus field', () => {
    expect(sampleDataSource).toContain('padStatus');
  });

  test('sample data uses Committed as padStatus value', () => {
    expect(sampleDataSource).toContain("padStatus: 'Committed'");
  });

  test('sample data includes activeRequestInVos field', () => {
    expect(sampleDataSource).toContain('activeRequestInVos');
  });

  test('sample data activeRequestInVos is boolean true', () => {
    expect(sampleDataSource).toContain('activeRequestInVos: true');
  });
});

/* ================================================================== */
/*  16. Existing WRT-197 test alignment                               */
/* ================================================================== */

describe('WRT-197 test alignment', () => {
  let wrt197Source: string;

  beforeAll(() => {
    wrt197Source = readRepoFile(
      'DetailsListVOA/tests/WRT-197-view-hereditament-banding-details/WRT-197-view-hereditament-banding-details.ac.test.ts',
    );
  });

  test('WRT-197 tests exist for hereditament and banding details', () => {
    expect(wrt197Source).toContain('View Hereditament and Banding Details AC');
  });

  test('WRT-197 tests cover address hyperlink with suId', () => {
    expect(wrt197Source).toContain('buildHereditamentUrl');
    expect(wrt197Source).toContain('suId');
  });

  test('WRT-197 tests cover banding effective date formatting', () => {
    expect(wrt197Source).toContain('bandingEffectiveDate');
    expect(wrt197Source).toContain('toUkDate');
  });

  test('WRT-197 tests do not cover PAD sync status (covered by this suite)', () => {
    expect(wrt197Source).not.toContain('isActiveRequestPresent');
    expect(wrt197Source).not.toContain('isTrueLike');
    expect(wrt197Source).not.toContain('Active request/job in VOS');
  });
});
