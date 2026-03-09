# Plugin Calling Guide — SVTList PCF Control

This document explains **how the PCF control calls Dataverse Custom API plugins**, covering the invocation method, input parameter building, response parsing, and the full call chain for both data-fetch (Function) and action (Action) plugins.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Web API Executor Resolution](#2-web-api-executor-resolution)
3. [Core Invocation Method — `executeUnboundCustomApi`](#3-core-invocation-method--executeunboundcustomapi)
4. [Request Object & Metadata (`buildUnboundCustomApiRequest`)](#4-request-object--metadata-buildunboundcustomapirequest)
5. [Plugin Operation Types: Function vs Action](#5-plugin-operation-types-function-vs-action)
6. [Calling Plugins WITH Inputs](#6-calling-plugins-with-inputs)
7. [Calling Plugins WITHOUT Inputs](#7-calling-plugins-without-inputs)
8. [How Input Parameters Are Built (Filter → API Params)](#8-how-input-parameters-are-built-filter--api-params)
9. [Response Parsing & Unwrapping](#9-response-parsing--unwrapping)
10. [Plugin-by-Plugin Reference](#10-plugin-by-plugin-reference)
11. [Server-Side Plugin Execution Pattern](#11-server-side-plugin-execution-pattern)

---

## 1. Architecture Overview

```
PCF Control (TypeScript)
    │
    ├─ DataService.ts        ← orchestrates all API calls
    │      │
    │      └─ CustomApi.ts   ← low-level executor (WebApi.execute)
    │
    └─ Dataverse Custom APIs (Unbound)
           │
           └─ C# Plugins (PluginBase → ExecuteCdsPlugin)
                  │
                  └─ APIM / External REST API
```

The PCF control **never calls an external HTTP endpoint directly**. All external calls are proxied through Dataverse **Custom API plugins** via `WebApi.execute()`.

---

## 2. Web API Executor Resolution

**File:** [`DetailsListVOA/services/CustomApi.ts`](../DetailsListVOA/services/CustomApi.ts)

The control supports three execution environments and picks the correct WebApi handle automatically:

```typescript
const getWebApiExecutor = (context) => {
  // 1. PCF context.webAPI (standard PCF harness / Canvas)
  const webApi = context.webAPI;
  if (webApi?.execute) return webApi;

  // 2. Xrm.WebApi.online (Model-Driven App via global Xrm)
  if (Xrm?.WebApi?.online?.execute) return Xrm.WebApi.online;

  // 3. Xrm.WebApi (fallback)
  if (Xrm?.WebApi?.execute) return Xrm.WebApi;

  return {}; // no executor — throws on call
};
```

---

## 3. Core Invocation Method — `executeUnboundCustomApi`

**File:** [`DetailsListVOA/services/CustomApi.ts`](../DetailsListVOA/services/CustomApi.ts)

This is the **single function** used for every Custom API call in the codebase:

```typescript
export const executeUnboundCustomApi = async <T>(
  context: ComponentFramework.Context<IInputs>,
  operationName: string,              // e.g. "voa_GetAllSalesRecord"
  params: Record<string, string>,     // input parameters (can be empty {})
  options?: { operationType?: number }, // 1 = Function (default), 0 = Action
): Promise<T>
```

**What it does:**
1. Resolves the WebApi executor.
2. Builds an unbound Custom API request object with metadata.
3. Calls `executor.execute(request)`.
4. Reads the JSON response body and returns it as type `T`.

---

## 4. Request Object & Metadata (`buildUnboundCustomApiRequest`)

Every call to `WebApi.execute` requires a request object that implements `getMetadata()`. The builder creates this dynamically from the params map:

```typescript
const request = {
  // Input params are spread directly onto the request object
  pageNumber: "1",
  pageSize: "25",
  taskStatus: "New,Assigned",

  getMetadata: () => ({
    boundParameter: null,         // unbound = no entity context
    operationType: 1,             // 1 = Function, 0 = Action
    operationName: "voa_GetAllSalesRecord",
    parameterTypes: {
      pageNumber: { typeName: "Edm.String", structuralProperty: 1 },
      pageSize:   { typeName: "Edm.String", structuralProperty: 1 },
      // ... one entry per param key
    },
  }),
};
```

> **All parameters are typed as `Edm.String`** regardless of their semantic type (numbers, dates, booleans are all passed as strings).

---

## 5. Plugin Operation Types: Function vs Action

| `operationType` | Value | HTTP Method | Dataverse Behaviour |
|---|---|---|---|
| `function` | `1` | `GET` | Read-only, no side effects |
| `action` | `0` | `POST` | Can modify data, supports transactions |

**Resolved in code:**

```typescript
// ControlConfig.ts defaults
customApiName: 'voa_GetAllSalesRecord',
customApiType: 'function',   // GET — read-only data fetch

// Overridable via PCF manifest input parameter at runtime
const resolveCustomApiType = (context) => {
  const raw = context.parameters.customApiType?.raw; // from manifest
  return resolveCustomApiOperationType(raw ?? CONTROL_CONFIG.customApiType);
  // 'action' → 0, anything else → 1
};
```

---

## 6. Calling Plugins WITH Inputs

### 6a. Main Data Search — `executeSearch`

**File:** [`DetailsListVOA/services/DataService.ts`](../DetailsListVOA/services/DataService.ts)

Called when the grid loads or the user applies filters/pagination.

```typescript
const rawPayload = await executeUnboundCustomApi<TaskSearchResponse | SalesApiResponse>(
  context,
  customApiName,         // e.g. "voa_GetAllSalesRecord"
  apiParams,             // built by buildApiParamsFor() — see Section 8
  { operationType: customApiType },
);
```

**Typical params sent to the plugin:**

| Parameter | Example Value | Description |
|---|---|---|
| `pageNumber` | `"1"` | 1-based page number |
| `pageSize` | `"25"` | Records per page |
| `saleId` | `"SA-12345"` | Exact sale ID filter |
| `taskId` | `"T-987"` | Task ID filter |
| `uprn` | `"100023456789"` | UPRN filter |
| `address` | `"High Street"` | Partial address search |
| `postcode` | `"SW1A"` | Postcode prefix |
| `billingAuthority` | `"Westminster,Camden"` | Comma-separated list |
| `transactionDate` | `"2024-01-01"` | ISO date string |
| `salesPrice` + `salesPriceOperator` | `"200000"` + `"GE"` | Numeric range (`GE`, `LE`) |
| `taskStatus` | `"New,Assigned"` | Comma-separated statuses |
| `assignedTo` | `"user@example.com"` | Assigned user filter |
| `qcAssignedTo` | `"qcuser@example.com"` | QC assignee filter |
| `assignedFromDate` / `assignedToDate` | `"2024-01-01"` | Date range for assignment |
| `source` | `"myassignment"` | Table/view context |

### 6b. Filter Options Lookup — `fetchFilterOptions`

Fetches dropdown values for column filters (e.g. list of billing authorities):

```typescript
await executeUnboundCustomApi<{ values?: string[] }>(
  context,
  `${customApiName}_FilterOptions`,   // e.g. "voa_GetAllSalesRecord_FilterOptions"
  { tableKey, field, query },          // 3 params
  { operationType: customApiType },
);
```

### 6c. Task Assignment

```typescript
await executeUnboundCustomApi(
  context,
  CONTROL_CONFIG.taskAssignmentApiName,  // "voa_SvtTaskAssignment"
  {
    assignedToUserId: "...",
    taskId: "T-1,T-2,T-3",     // comma-separated batch
    assignedByUserId: "...",
    taskStatus: "Assigned",
    saleId: "...",
    date: "2024-06-01",
    screenName: "manager",      // used for RBAC on server side
  },
  { operationType: 0 },         // ACTION — modifies data
);
```

---

## 7. Calling Plugins WITHOUT Inputs

### 7a. User Context — `voa_SvtGetUserContext`

No input parameters required. The plugin resolves the calling user from `context.InitiatingUserId` automatically.

```typescript
await executeUnboundCustomApi<UserContextResult>(
  context,
  'voa_SvtGetUserContext',
  {},    // ← empty params
  { operationType: 1 },  // Function
);
```

**Returns:** `svtPersona`, `hasSvtAccess`, `matchedTeamName`, `matchedRoleName`, `resolutionSource`

### 7b. Assignable Users — `voa_SvtGetAssignableUsers`

```typescript
await executeUnboundCustomApi<{ users?: AssignableUser[] }>(
  context,
  CONTROL_CONFIG.assignableUsersApiName,  // "voa_SvtGetAssignableUsers"
  {},    // ← no inputs; server resolves based on caller's persona
  { operationType: resolveCustomApiOperationType(CONTROL_CONFIG.assignableUsersApiType) },
);
```

---

## 8. How Input Parameters Are Built (Filter → API Params)

**File:** [`DetailsListVOA/config/TableConfigs.ts`](../DetailsListVOA/config/TableConfigs.ts)

The `buildApiParamsFor(tableKey, filters, page, pageSize)` function maps the UI `GridFilterState` object into a flat `Record<string, string>` that gets passed to the plugin.

**Key transformation rules:**

| UI Filter | API Param | Transformation |
|---|---|---|
| `filters.billingAuthority: string[]` | `billingAuthority` | `.join(',')` |
| `filters.reviewFlags: string[]` | `reviewFlag` | `.join(',')` |
| `filters.taskStatus: string[]` | `taskStatus` | `.join(',')` |
| `filters.salePrice.mode = '>='` | `salesPrice` + `salesPriceOperator: "GE"` | Split into value + operator |
| `filters.salePrice.mode = '<='` | `salesPrice` + `salesPriceOperator: "LE"` | Split into value + operator |
| `filters.assignedDate.from/to` | `assignedFromDate` / `assignedToDate` | Separate from/to params |
| `filters.transactionDate.from === to` | `transactionDate` | Single date (exact match) |
| `page` (0-based) | `pageNumber` | `String(page + 1)` — converted to 1-based |

---

## 9. Response Parsing & Unwrapping

**File:** [`DetailsListVOA/services/DataService.ts`](../DetailsListVOA/services/DataService.ts)

### Step 1 — Unwrap Custom API envelope

The Dataverse Custom API wraps the plugin output in a `Result` field:

```typescript
export const unwrapCustomApiPayload = (payload: unknown): SalesPayload => {
  const raw = payload.Result ?? payload.result;
  if (typeof raw === 'string') {
    return JSON.parse(raw);  // plugins return JSON string in OutputParameters["Result"]
  }
  return payload;
};
```

### Step 2 — Normalize to TaskSearchResponse

The response can come from two API shapes (legacy TaskSearch format or newer SalesApi format):

```typescript
export const normalizeSearchResponse = (payload): TaskSearchResponse => {
  if ('sales' in payload || 'pageInfo' in payload) {
    // SalesApiResponse shape:  { pageInfo: {...}, sales: [...] }
    return {
      items: payload.sales.map(normalizeSalesItem),
      totalCount: payload.pageInfo?.totalRecords ?? payload.pageInfo?.totalRows,
      page: payload.pageInfo?.pageNumber ?? 1,
      pageSize: payload.pageInfo?.pageSize,
      filters: normalizeFilterMap(payload.filters),
    };
  }
  // TaskSearchResponse shape — already in correct format
  return payload;
};
```

### Step 3 — Field normalization aliases

The `normalizeSalesItem` function uses **key normalization** to handle typos and case variations from the API:

```typescript
const buildNormalizedMap = (item) => {
  // strips all non-alphanumeric, lowercases every key
  // e.g. "DwellingType" → "dwellingtype"
  //      "billingauthorityity" → "billingauthorityity" (typo-safe alias)
};
```

Explicit aliases handled:
- `billingauthorityity` → `billingAuthority`
- `dwellinlingtype`, `dwelwellingtype` → `dwellingType` (typo variants)
- `taskcomplpleteddate` → `taskCompletedDate`
- `summaryFlag` → `summaryFlags` (singular/plural)
- `reviewFlag` → `reviewFlags`

`summaryFlags` is further split on `;` delimiter: `"A;B;C"` → `["A", "B", "C"]`

---

## 10. Plugin-by-Plugin Reference

| Custom API Name | Plugin Class | Type | Inputs | Output |
|---|---|---|---|---|
| `voa_GetAllSalesRecord` | `GetAllSalesRecord` | **Function** (GET) | `pageNumber`, `pageSize`, + all filter params | `Result` (JSON string) |
| `voa_GetViewSaleRecordById` | `GetViewSaleRecordById` | **Function** (GET) | `saleId` | `Result` (JSON string) |
| `voa_SvtGetSalesMetadata` | `SvtGetSalesMetadata` | **Function** (GET) | None or minimal | `Result` (JSON string) |
| `voa_SvtGetUserContext` | `SvtGetUserContext` | **Function** (GET) | None (uses `InitiatingUserId`) | `svtPersona`, `hasSvtAccess`, `matchedTeamName`, `matchedRoleName`, `resolutionSource` |
| `voa_SvtGetAssignableUsers` | `SvtGetAssignableUsers` | **Function** (GET) | None | Users list |
| `voa_SvtTaskAssignment` | `SvtTaskAssignment` | **Action** (POST) | `assignedToUserId`, `taskId`, `taskStatus`, `saleId`, `assignedByUserId`, `date`, `screenName` | Result |
| `voa_SvtManualTaskCreation` | `SvtManualTaskCreation` | **Action** (POST) | Task creation fields | Result |
| `voa_SvtModifyTask` | `SvtModifyTask` | **Action** (POST) | Task modification fields | Result |
| `voa_SvtSubmitSalesVerification` | `SvtSubmitSalesVerification` | **Action** (POST) | `saleId`, `saleSubmitPayload`, `saleSubmitRemarks` | Result |
| `voa_SvtSubmitQcRemarks` | `SvtSubmitQcRemarks` | **Action** (POST) | QC remark fields | Result |

---

## 11. Server-Side Plugin Execution Pattern

All C# plugins follow the same pattern inside `ExecuteCdsPlugin`:

### Step 1 — Resolve secrets via `voa_CredentialProvider`

```csharp
var getSecretsRequest = new OrganizationRequest("voa_CredentialProvider")
{
    ["ConfigurationName"] = "SVTGetSalesRecord"
};
var getSecretsResponse = localPluginContext.SystemUserService.Execute(getSecretsRequest);
// Extracts: Address, ClientId, ClientSecret, Scope, APIMSubscriptionKey, TenantId
```

### Step 2 — Read Input Parameters

```csharp
// Inputs from context.InputParameters (all as strings)
var saleId   = GetInput(context, "saleId");
var taskId   = GetInput(context, "taskId");
var screenName = GetInput(context, "screenName");

// Numeric inputs use a typed helper
var page     = GetIntInput(context, "pageNumber", 1);
var pageSize = GetIntInput(context, "pageSize", 25);
```

For `GetAllSalesRecord`, the inputs are also turned into a query string via:
```csharp
var searchQuery = CustomApiQueryHelper.BuildSearchQuery(context.InputParameters);
var fullUrl = BuildUrl(apiConfig.Address, searchQuery);
// Result: https://apim.example.com/sales?pageNumber=1&pageSize=25&taskStatus=New
```

### Step 3 — Optional RBAC Check

Action plugins (e.g. `SvtTaskAssignment`, `SvtSubmitSalesVerification`) check the caller's persona **before** calling APIM:

```csharp
var userContext = UserContextResolver.Resolve(
    localPluginContext.SystemUserService, context.InitiatingUserId, trace);

if (!AssignmentContextResolver.IsAuthorized(userContext.Persona, assignmentContext))
    throw new InvalidPluginExecutionException("Access denied.");
```

### Step 4 — OAuth Token

```csharp
var auth = new Authentication(localPluginContext, apiConfig);
var authResult = auth.GenerateAuthentication();
// Sets Bearer token on HttpClient
```

### Step 5 — HTTP Call (GET or POST)

```csharp
// Function plugins → GET
using var request = new HttpRequestMessage(HttpMethod.Get, fullUrl);

// Action plugins → POST with JSON body
var jsonBody = JsonSerializer.Serialize(payload);
using var request = new HttpRequestMessage(HttpMethod.Post, apiConfig.Address)
{
    Content = new StringContent(jsonBody, Encoding.UTF8, "application/json")
};

response = httpClient.SendAsync(request).GetAwaiter().GetResult();
body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
```

### Step 6 — Write Output

```csharp
// All data plugins return raw JSON in OutputParameters["Result"]
context.OutputParameters["Result"] = body;

// SvtGetUserContext returns typed individual output params
context.OutputParameters["svtPersona"] = persona.ToString();
context.OutputParameters["hasSvtAccess"] = persona != UserPersona.None;
context.OutputParameters["matchedTeamName"] = result.MatchedTeamName;
```

---

## Quick Reference: Full Call Chain for Grid Load

```
User opens grid / changes filter
        │
        ▼
GridDataController.ts → executeSearch(context, { tableKey, page, pageSize, filters })
        │
        ▼
DataService.ts: buildApiParamsFor(tableKey, filters, page, pageSize)
  → produces flat Record<string,string> of all active filters
        │
        ▼
DataService.ts: executeUnboundCustomApi(context, "voa_GetAllSalesRecord", params, { operationType: 1 })
        │
        ▼
CustomApi.ts: buildUnboundCustomApiRequest(operationName, params, 1)
  → creates request object with getMetadata() returning operationType=1 (Function)
        │
        ▼
WebApi.execute(request)   ← Dataverse HTTP GET to Custom API endpoint
        │
        ▼
C# GetAllSalesRecord plugin
  1. voa_CredentialProvider → gets APIM credentials
  2. BuildSearchQuery(InputParameters) → builds query string
  3. HTTP GET to APIM URL
  4. context.OutputParameters["Result"] = raw JSON body
        │
        ▼
DataService.ts: unwrapCustomApiPayload(rawPayload)
  → extracts payload.Result (string) → JSON.parse()
        │
        ▼
DataService.ts: normalizeSearchResponse(payload)
  → handles both SalesApiResponse and TaskSearchResponse shapes
  → normalizes field names (alias mapping, typo tolerance)
        │
        ▼
Grid renders rows via mapTaskItemToRecord()
```
