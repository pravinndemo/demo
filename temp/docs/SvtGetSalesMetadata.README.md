# voa_SvtGetSalesMetadata (Custom API) - README

## Overview
`voa_SvtGetSalesMetadata` is a Dataverse Custom API backed by the `SvtGetSalesMetadata` plugin.
It calls an APIM endpoint (configured in `voa_CredentialProvider`) and returns the raw JSON payload
via the `Result` output parameter. The PCF control uses this metadata to populate **Billing Authority**
dropdowns (Sales Search and Manager Assignment prefilter).

## What It Returns
The API expects a JSON response similar to:
```json
{
  "billingAuthority": ["Pembrokeshire", "Newport", "Cardiff"]
}
```

The plugin forwards the response body to the `Result` output parameter unchanged.

On error, it returns:
```json
{
  "billingAuthority": [],
  "errorMessage": "..."
}
```

## Where It Is Used
- PCF control calls the Custom API to get Billing Authority options.
- The options are shown in:
  - Sales Search "Billing Authority" ComboBox
  - Manager Assignment prefilter (with an "All" option)

## Setup Steps
1. **Create Dataverse Custom API**
   - Name: `voa_SvtGetSalesMetadata`
   - Unique name: `voa_SvtGetSalesMetadata`
   - Is Function: `true` (GET)
   - Output parameter:
     - Name: `Result`
     - Type: `String`

2. **Register the Plugin Step**
   - Assembly: VOA.SVT.Plugins
   - Class: `VOA.SVT.Plugins.CustomAPI.SvtGetSalesMetadata`
   - Message: `voa_SvtGetSalesMetadata`
   - Execution: synchronous

3. **Add Credential Provider Configuration**
   - Action: `voa_CredentialProvider`
   - Configuration name: `SVTGetSalesMetadata`
   - Required fields:
     - Address: APIM metadata endpoint (e.g. `/ctp/sales-verification-api/v1/metadata`)
     - ClientId / ClientSecret / Scope / TenantId (if required by APIM)
     - APIMSubscriptionKey (if required by APIM)

4. **PCF Configuration (if needed)**
   - Control properties:
     - `metadataApiName` = `voa_SvtGetSalesMetadata`
     - `metadataApiType` = `function`

## Error Handling
The plugin:
- Returns `{ billingAuthority: [], errorMessage: "..." }` when:
  - Configuration is missing
  - APIM call fails
  - Exceptions are thrown

The PCF control:
- Shows a disabled dropdown state with an error message.
- Handles null/missing payloads gracefully.

## Notes
- The plugin uses the same HTTP + auth approach as `GetAllSalesRecord`.
- The response is returned as-is, so any valid JSON structure can be sent,
  but the PCF expects `billingAuthority` (or `billingAuthorities`) as an array of strings.
