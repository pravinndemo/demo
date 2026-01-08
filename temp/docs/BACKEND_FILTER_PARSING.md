Backend Parsing for Column Filters

This grid serializes column header filters using bracket-style query params when calling HTTP endpoints (APIM):

- Single value: `filter[field]=text`
- Multi-value: `filter[field][]=v1&filter[field][]=v2`

Custom API note: For Dataverse unbound Custom APIs, dynamic parameter names with brackets are not valid. The control sends a JSON string parameter named `columnFilters` in that path. Your action should accept a `columnFilters` string and parse JSON.

Examples

JavaScript/Node (Express)

```js
// If using the default express query parser, repeated keys become arrays.
// Keys will include bracketed names, e.g. 'filter[address][]'.
app.get('/filterOptions', (req, res) => {
  const q = req.query;
  // Normalize into { [field: string]: string[] }
  const filters = {};
  Object.keys(q).forEach((key) => {
    const m = key.match(/^filter\[(.+?)\](\[\])?$/);
    if (!m) return;
    const field = m[1].toLowerCase();
    const val = q[key];
    const arr = Array.isArray(val) ? val : [val];
    filters[field] = (filters[field] || []).concat(arr.filter(Boolean).map(String));
  });
  // Use filters[field] array to build your DB query
  res.json({ values: [] });
});
```

ASP.NET Core (C#)

```csharp
[HttpGet("/revaluation/tasks")]
public IActionResult GetTasks([FromQuery] IQueryCollection query) {
    // query.Keys may contain entries like "filter[address]" and "filter[address][]"
    var filters = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
    foreach (var kvp in query) {
        var key = kvp.Key;
        var match = System.Text.RegularExpressions.Regex.Match(key, @"^filter\[(.+?)\](\[\])?$");
        if (!match.Success) continue;
        var field = match.Groups[1].Value;
        if (!filters.TryGetValue(field, out var list)) {
            list = new List<string>();
            filters[field] = list;
        }
        foreach (var val in kvp.Value) {
            if (!string.IsNullOrWhiteSpace(val)) list.Add(val);
        }
    }
    // Use filters[field] to build EF/SQL predicates
    return Ok(new { items = new object[0] });
}
```

Dataverse Custom API (Action)

```csharp
// Define a string input parameter named "columnFilters" on your unbound action.
// The control passes JSON like: { "address": ["1 Example Rd"], "postcode": "CF12" }
var json = executionContext.InputParameters["columnFilters"] as string;
var filters = string.IsNullOrWhiteSpace(json)
    ? new Dictionary<string, object>()
    : System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(json);
```

