# VT Team README: PCF -> Dataverse Custom API Plugin -> APIM

## Purpose
This guide explains the integration pattern used in this repo so another team can reuse it:

1. PCF calls an unbound Dataverse Custom API.
2. The Custom API plugin reads input parameters.
3. The plugin calls APIM/external API.
4. The plugin returns a response via `OutputParameters["Result"]`.
5. PCF parses the response and updates UI/output properties.

## End-to-End Flow

```text
PCF (TypeScript)
  -> executeUnboundCustomApi()
  -> Dataverse Custom API (Function/Action)
  -> Plugin (C#)
  -> APIM endpoint (GET/POST/PUT...)
  -> Plugin OutputParameters["Result"] (JSON string)
  -> PCF parses Result/result
```

## PCF Side (TypeScript)

### Shared helper
Use `executeUnboundCustomApi` from:
- `DetailsListVOA/services/CustomApi.ts`

Key behavior:
- All input parameters are sent as `Edm.String`.
- `operationType`:
  - `1` = Function
  - `0` = Action

### Example A: Function call (view sale details)

```ts
const response = await executeUnboundCustomApi<unknown>(
  context,
  'voa_GetViewSaleRecordById',
  { saleId: 'S-1000001' },
  { operationType: 1 }, // function
);
```

### Example B: Action call (task assignment)

```ts
const response = await executeUnboundCustomApi<Record<string, unknown>>(
  context,
  'voa_SvtTaskAssignment',
  {
    assignedToUserId: '22222222-2222-2222-2222-222222222222',
    taskId: JSON.stringify(['1000234', '1000235']),
    assignedByUserId: '11111111-1111-1111-1111-111111111111',
    screenName: 'manager assignment',
    taskStatus: 'New',
  },
  { operationType: 0 }, // action
);
```

### Parse `Result` safely in PCF

```ts
const unwrapCustomApiPayload = (payload: unknown): unknown => {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const raw = record.Result ?? record.result;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
  }
  return payload;
};
```

## Plugin Side (C#)

### Minimal pattern

```csharp
var context = localPluginContext.PluginExecutionContext;
var inputA = context.InputParameters.Contains("inputA")
    ? context.InputParameters["inputA"]?.ToString()
    : null;

// Build APIM payload/query from input parameters
var apimPayload = new
{
    field1 = inputA ?? string.Empty
};

// Call APIM
// (HttpClient + auth + APIM subscription key, based on your configuration)

// Return JSON string to PCF
context.OutputParameters["Result"] = jsonResponseBody;
```

### Existing examples in this repo
- `GetAllSalesRecord.cs` (Function + query-style inputs -> APIM GET)
- `GetViewSaleRecordById.cs` (Function + `saleId` -> APIM GET)
- `SvtTaskAssignment.cs` (Action + assignment payload -> APIM POST)
- `SvtSubmitQcRemarks.cs` (Action + QC payload -> APIM POST)

## Parameter Mapping (When VT names differ)

Your PCF parameter names do not need to match APIM names. Map in plugin code.

### Mapping template

| PCF -> Custom API input | Plugin variable | APIM field |
| --- | --- | --- |
| `assignedToUserId` | `assignedToUserId` | `assigneeId` |
| `taskId` | `taskIds` | `tasks` |
| `assignedByUserId` | `requestedBy` | `requested_by` |
| `screenName` | `screenName` | `sourceScreen` |

### Example mapping code

```csharp
var assignedToUserId = GetInput(context, "assignedToUserId");
var taskId = GetInput(context, "taskId");
var assignedBy = GetInput(context, "assignedByUserId");
var screenName = GetInput(context, "screenName");

var apimBody = new
{
    assigneeId = assignedToUserId,
    tasks = ParseTaskIds(taskId),
    requested_by = assignedBy,
    sourceScreen = screenName
};
```

## Response Contract Recommendation

For consistency, return a JSON object in `Result`:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

If APIM already returns JSON, forward that JSON as-is:

```csharp
context.OutputParameters["Result"] = body;
```

## Dataverse Custom API Setup Checklist

1. Create unbound Custom API.
2. Choose type:
   - Function -> `operationType = 1` in PCF
   - Action -> `operationType = 0` in PCF
3. Add input parameters as `String` (current pattern in this repo).
4. Add output parameter:
   - `Result` (String)
5. Register plugin step for the Custom API message.
6. Validate security/authorization logic in plugin.

## Troubleshooting

- Error: `execute is not a function` in harness  
  Use Dataverse runtime; PCF test harness does not fully support Web API execute.

- Empty data in PCF  
  Check plugin writes `OutputParameters["Result"]`.

- JSON parse errors in PCF  
  Ensure `Result` contains valid JSON string.

- APIM call works directly but fails from plugin  
  Validate credential provider config (`Address`, subscription key, OAuth scope/secret).

## File References

- PCF helper: `DetailsListVOA/services/CustomApi.ts`
- PCF search and unwrap: `DetailsListVOA/services/DataService.ts`
- PCF assignment/QC calls: `DetailsListVOA/components/DetailsListHost/DetailsListHost.tsx`
- PCF view-sale call: `DetailsListVOA/index.ts`
- Plugin query mapping helper: `VOA.SVT.Plugins/Helpers/CustomApiQueryHelper.cs`
- Plugin examples:
  - `VOA.SVT.Plugins/Plugins/CustomAPI/GetAllSalesRecord.cs`
  - `VOA.SVT.Plugins/Plugins/CustomAPI/GetViewSaleRecordById.cs`
  - `VOA.SVT.Plugins/Plugins/CustomAPI/SvtTaskAssignment.cs`
  - `VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitQcRemarks.cs`
