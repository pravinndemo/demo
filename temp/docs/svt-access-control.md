# SVT Plugin Access Control

This document summarizes how SVT plugins determine access based on **teams**, **roles**, and derived **persona**.

---

## Persona Resolution (UserContextResolver)
`VOA.SVT.Plugins/Helpers/UserContextResolver.cs`

1. **Teams (security groups) are evaluated first**:
   - `SVT Manager Team` → `Manager`
   - `SVT QA Team` → `QA`
   - `SVT User Team` → `User`
2. If no matching team, **roles** are evaluated:
   - `VOA - SVT Manager` → `Manager`
   - `VOA - SVT QA` → `QA`
   - `VOA - SVT User` → `User`

Only one persona is returned (priority order: Manager → QA → User).  
The resolver also collects **all matched teams/roles** for access checks.

---

## Caseworker-Only Access (UserContextResolver.HasCaseworkerAccess)
`VOA.SVT.Plugins/Helpers/UserContextResolver.cs`

**Allowed** if either:
- Persona is `User` (caseworker), **or**
- Persona is `Manager` or `QA` **and** user is also a member of **SVT User Team** or has **VOA - SVT User** role.

**Denied** otherwise.

---

## Plugins Using Caseworker-Only Access

### Submit Sales Verification
`VOA.SVT.Plugins/Plugins/CustomAPI/SvtSubmitSalesVerification.cs`
- Uses `HasCaseworkerAccess`.
- Manager/QA must also have SVT User membership to pass.

### Modify Task
`VOA.SVT.Plugins/Plugins/CustomAPI/SvtModifyTask.cs`
- Uses `HasCaseworkerAccess`.
- Manager/QA must also have SVT User membership to pass.

---

## Task Assignment Access
`VOA.SVT.Plugins/Helpers/AssignmentContextResolver.cs`

Access is **screen-context driven**:
- **Manager assignment screen** → Manager persona only.
- **QA assignment screen** → Manager or QA persona.
- **Unknown context** → denied.

This is independent of caseworker-only access rules.

---

## Notes
- Mixed membership is supported: Manager/QA can act as caseworker **only** if they also have SVT User membership.
- The `SvtGetUserContext` API exposes persona + matched team/role lists if you need diagnostics.
