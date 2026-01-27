# voa_SvtGetUserContext Custom API (User Context)

## Purpose
`voa_SvtGetUserContext` is an **unbound** Dataverse Custom API that resolves the current user’s **SVT persona** (`Manager`, `QA`, or `User`) and returns the matching team/role context. It uses the initiating user ID from the Dataverse execution context and delegates resolution to `UserContextResolver`.【F:VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetUserContext.cs†L24-L56】【F:VOA.SVT.Plugins/Helpers/UserContextResolver.cs†L45-L200】

---

## Resolution logic (teams → roles)
The resolver checks for SVT **security-group team** membership first, then falls back to **Dataverse roles** if no matching teams are found. The team/role names used for matching are hard-coded in `UserContextConfig` (SVT Manager/QA/User).【F:VOA.SVT.Plugins/Helpers/UserContextResolver.cs†L30-L190】

Persona mapping summary:
- `SVT Manager Team` / `VOA - SVT Manager` → `Manager`
- `SVT QA Team` / `VOA - SVT QA` → `QA`
- `SVT User Team` / `VOA - SVT User` → `User`

---

## Output parameters
The Custom API writes output parameters directly (not a JSON string). These are the key outputs:

| Output | Type | Description |
| --- | --- | --- |
| `svtPersona` | string | Resolved persona (`Manager`, `QA`, `User`, or `None`). |
| `resolutionSource` | string | `Team`, `Role`, or `None`. |
| `hasSvtAccess` | boolean | `true` if persona is not `None`. |
| `matchedTeamName` | string | Team name that matched (if any). |
| `matchedRoleName` | string | Primary role name that matched (if any). |
| `matchedRoleNames` | string | Semicolon-delimited list of matched roles. |

These outputs are set by `SvtGetUserContext` after resolution completes.【F:VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetUserContext.cs†L45-L56】

---

## Canvas app usage (App.OnStart)
Call the Custom API once on app start and store the outputs in a global variable for screen-level logic.

```powerfx
// App.OnStart
Set(
    gblSvtUserContext,
    voa_SvtGetUserContext.Run()
);

// Example usage
Set(gblIsManager, gblSvtUserContext.svtPersona = "Manager");
```

---

## Related docs
- `docs/svtTaskAssignment.md` (assignment API authorization uses the same persona mapping).
