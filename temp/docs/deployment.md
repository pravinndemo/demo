---

# SVT Sitemap Visibility, Security & Deployment Model (Welsh Reform)

## 1. Purpose

This document defines the **end-to-end technical approach** for delivering the **Sales Verification Tool (SVT)** under the Welsh Reform programme, covering:

* How SVT components are packaged and deployed
* How sitemap visibility is controlled using **Dataverse table permissions**
* How solution ownership is managed between **SVT** and **CT**
* How deployments are sequenced across environments to avoid dependency and overwrite issues

The objective is to enable **independent SVT delivery** while ensuring **zero risk** to the existing **CT model-driven application**.

---

## 2. Architectural Context

* SVT is **not a standalone application**
* SVT is implemented as a **set of custom pages and components inside the existing CT model-driven app**
* The CT app remains the **single shell application**
* SVT behaves as a **feature set** that is surfaced conditionally

This approach aligns with:

* Existing VOA/BST architecture
* Dataverse ALM best practices
* Welsh Reform phased rollout requirements

---

## 3. Core Design Principles

The following principles are mandatory for SVT:

1. **Single sitemap owner per environment**
2. **Independent solutions and pipelines**
3. **Security-driven visibility**
4. **Deploy early, enable late**
5. **No hidden coupling between CT and SVT**

These principles ensure that CT and SVT can evolve independently without accidental breakage.

---

## 4. Solution Ownership Model

### 4.1 SVT Solution (SVT-Owned)

The SVT solution is owned and deployed by the **SVT pipeline**.

It includes:

* PCF control(s)
* Plugins (SVT-specific assemblies and steps)
* Custom APIs / Custom Actions (including request & response definitions)
* SVT Dataverse table(s)
* Global choices used by SVT tables
* SVT security roles:

  * VOA SVT User (Caseworker)
  * VOA SVT Manager
  * VOA SVT QA

The SVT solution **must not include**:

* Sitemap
* CT model-driven app
* CT tables, views, or forms (unless explicitly approved)
* CT security roles

> The SVT solution must always be deployable **independently**.

---

### 4.2 CT Solution (CT-Owned)

The CT solution remains the **single owner of the sitemap**.

It includes:

* Sitemap updates only (SVT/VT navigation subareas)
* No SVT logic or components

This avoids:

* “last deployment wins” sitemap overwrites
* Deployment coupling between CT and SVT
* Rollback risks during releases or hotfixes

---

## 5. Sitemap Visibility Using Table Permissions

### 5.1 Why Table Permissions

SVT sitemap visibility is controlled using **Dataverse table permissions**, rather than feature flags embedded in the sitemap XML.

This approach:

* Uses native platform security
* Requires no custom code
* Is environment-safe
* Is consistent across DEV, SIT, UAT, and PROD

---

### 5.2 Anchor Table Concept

Each SVT sitemap subarea references an **SVT-owned anchor table**, for example:

* SVT Condition Scoring Model
* SVT Task
* SVT Case (if introduced later)

The table does **not** need to be the primary UI table.
Its sole purpose is to act as a **visibility gate**.

---

### 5.3 Visibility Behaviour

Dataverse evaluates sitemap visibility as follows:

* If the user **has Read permission** on the referenced table → subarea is visible
* If the user **does not have permission** → subarea is hidden

This evaluation happens automatically and consistently.

---

### 5.4 Security Role Configuration

For SVT roles, the anchor table is configured as:

* **Read access:** Organisation level
* **Create/Update/Delete:** None (for caseworkers)
* Manager/QA write access only if explicitly required

CT-only roles do **not** have permission to the anchor table and therefore **never see SVT navigation**.

---

## 6. Security Model Summary

Access to SVT requires **all** of the following:

1. SVT security role (Caseworker / Manager / QA)
2. Appropriate CT base role (to open CT app shell)
3. Read permission to SVT anchor table
4. Membership via Teams or direct role assignment

Missing any one of these prevents access.

---

## 7. Deployment & Promotion Strategy

SVT follows a **deploy-first, enable-later** model.

### 7.1 Deployment Order (Per Environment)

#### Step 1 — Deploy SVT Solution

Deploy the SVT solution to the environment.

Result:

* SVT components exist
* No CT navigation points to SVT yet
* No user impact

---

#### Step 2 — Security Setup

* Assign SVT roles to Teams or test users
* Validate permissions on anchor table
* Ensure CT base roles are present

---

#### Step 3 — Deploy CT Sitemap Update (Last)

Deploy CT solution containing sitemap updates referencing SVT anchor table.

Result:

* SVT navigation becomes visible **only** to authorised users
* No dependency errors (SVT tables already exist)
* No risk of sitemap overwrite by SVT pipeline

---

### 7.2 Why This Order Is Mandatory

* Sitemap references must only point to **existing components**
* SVT must never depend on CT deployment timing
* CT hotfixes must not be blocked by SVT changes

---

## 8. Early Deployment Safety

SVT components can be safely deployed early to PROD because:

* Navigation is hidden via table permissions
* Users without SVT roles cannot see SVT
* Plugins can be guarded internally (optional feature flag/config check)
* Custom APIs are inaccessible without UI + role access

This supports:

* Dry runs
* Production readiness testing
* Go-live confidence

---

## 9. Governance Rules (Strict)

The following rules are non-negotiable:

1. **Sitemap exists in one solution only**
2. **SVT solution never contains sitemap**
3. **All SVT navigation must use table permissions**
4. **CT solution deploys navigation last**
5. **SVT pipeline must not overwrite CT artifacts**

Any deviation requires architectural approval.

---

## 10. Operational Checks (Post Deployment)

After SVT deployment:

* Confirm SVT table(s) and global choices exist
* Confirm SVT roles exist
* Confirm PCF and custom pages load for authorised users
* Confirm CT-only users cannot see SVT navigation

After CT sitemap deployment:

* Confirm SVT subareas appear correctly
* Confirm visibility matches role assignment
* Confirm no CT navigation regression

---

## 11. Summary

This model provides:

* Clear ownership boundaries
* Independent CI/CD pipelines
* Secure, role-based navigation
* Safe early deployment
* Minimal operational risk

**SVT deploys independently.
CT controls navigation.
Security controls visibility.**

---

