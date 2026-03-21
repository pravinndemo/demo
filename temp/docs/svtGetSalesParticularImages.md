# voa_SvtGetSalesParticularImages

## Purpose
`voa_SvtGetSalesParticularImages` is an unbound Dataverse Custom API plugin that fetches Sales Particular guidance/compare images through APIM (which then reads SharePoint).

Plugin class: `VOA.SVT.Plugins.CustomAPI.SvtGetSalesParticularImages`

## Input parameters
All parameters are expected as `String` in the Custom API definition.

- `saleId` (required)
- `attribute` (optional)  
  Example values: `kitchenAge`, `kitchenSpecification`, `bathroomAge`, `bathroomSpecification`, `decorativeFinishes`
- `compareWith` (optional)
- `source` (optional)
- `continuationToken` (optional)
- `top` (optional, numeric string)

## Output parameter
- `Result` (String)

On success, the plugin forwards APIM JSON response as-is in `Result`.

On error, the plugin returns:

```json
{
  "saleId": "S-1004839",
  "attribute": "kitchenAge",
  "images": [],
  "continuationToken": "",
  "errorMessage": "..."
}
```

## Credential provider configuration
Add a `voa_CredentialProvider` configuration with:

- `ConfigurationName`: `SVTGetSalesParticularImages`
- `Address`: APIM endpoint URL
- `APIMSubscriptionKey` (if required)
- `ClientId`, `ClientSecret`, `Scope`, `TenantId` (if required)

## URL construction behavior
The plugin supports token replacement in Address:

- `{saleId}`
- `{attribute}`
- `{compareWith}`
- `{source}`

If `Address` does not contain a sales path, it appends:

- `/sales/{saleId}/particular-images`

Then optional query parameters are appended:

- `attribute`, `compareWith`, `source`, `continuationToken`, `top`

## Suggested APIM response contract
```json
{
  "saleId": "S-1004839",
  "attribute": "kitchenAge",
  "images": [
    {
      "id": "img-001",
      "title": "Kitchen reference",
      "capturedDate": "2025-10-01",
      "thumbnailUrl": "https://...",
      "fullImageUrl": "https://...",
      "altText": "Kitchen showing fitted units"
    }
  ],
  "continuationToken": "next-page-token"
}
```

## Dataverse registration
1. Create unbound Custom API `voa_SvtGetSalesParticularImages`
2. Type: Function (`operationType = 1` from PCF)
3. Add input params listed above as `String`
4. Add output param `Result` as `String`
5. Register plugin step for message `voa_SvtGetSalesParticularImages`
