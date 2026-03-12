# PCF Component Bundle Size Limit – Issue, Observation, and Proposed Approach for VT

## Context

During the development of the **VT PCF components (Map and Data Search)**, we encountered a limitation related to the **PCF bundle size during the production build process**. This limitation prevents the component from being successfully built and deployed into the Dataverse environment.

While investigating the issue and discussing with the team, we identified that there are **two different 5MB-related limits involved** in this scenario.

We also reviewed the approach currently used by the **Geo team**, who faced a similar issue earlier. The Geo team implemented a workaround that allows larger PCF bundles to be built and deployed successfully.

Based on that discussion, it appears that **VT can adopt the same approach**, provided we document the risks and track the implementation appropriately.

---

# 1. PCF Bundle Size Limit (Build-Time Limitation)

## Issue

When running the **production build (`npm run build`)**, the PCF build process fails with the following error:

```
[pcf-1045] The bundle of the component exceeds the maximum size of 5MB allowed.
```

This occurs because the **PCF build tooling (`pcf-scripts`) enforces a bundle size limit of 5MB**.

The limit is defined inside the `pcf-scripts` package:

```
node_modules/pcf-scripts/constants.js
```

with the following constant:

```
exports.MAX_BUNDLE_SIZE_IN_MB = 5;
```

This validation is applied **only during the production build**, not during development mode.

Therefore:

* Local development builds may work successfully.
* The failure occurs only when creating the **production bundle used for Dataverse deployment**.

---

# 2. Geo Team Approach (Current Practice)

During discussion with the Geo team, we understood that they addressed the same issue by **overriding the bundle size limit defined in `pcf-scripts`**.

Specifically, they modified the constant:

```
MAX_BUNDLE_SIZE_IN_MB = 5
```

to a higher value:

```
MAX_BUNDLE_SIZE_IN_MB = 20
```

Since modifying files directly inside `node_modules` is not persistent (because packages are reinstalled during each build), they implemented this using **patch-package**.

### Implementation Approach

1. Install **patch-package**
2. Create a patch for `pcf-scripts`
3. Add a **postinstall script** so the patch runs automatically after `npm install`

Flow:

```
npm install
      ↓
postinstall script runs
      ↓
patch-package applies patch
      ↓
pcf-scripts bundle limit updated
      ↓
npm run build succeeds
```

The Geo team indicated that this approach is currently working for their components.

---

# 3. Dataverse Upload Size Limit

In addition to the PCF build limit, there is another **5MB limitation at the Dataverse environment level**.

Dataverse treats PCF bundle files as **attachments**, and attachments have a default maximum size limit of:

```
5MB (5120 KB)
```

This value is configured under:

```
Environment Settings → Email → Maximum file size
```

### Geo Team Deployment Approach

The Geo team addressed this by modifying the setting during deployment:

1. **Pre-deployment pipeline step**

   * Increase attachment size limit (for example to 20MB)

2. **Solution deployment**

   * Import solution containing the PCF bundle

3. **Post-deployment pipeline step**

   * Reset the environment setting back to the original value (5MB)

This ensures that the larger bundle can be deployed without permanently changing the environment configuration.

---

# 4. Observations

From the investigation and discussion with the Geo team, the following observations were made:

### 1. The 5MB PCF bundle limit is enforced by the PCF build tooling

This is not a runtime restriction but a **build-time validation implemented in `pcf-scripts`**.

### 2. The Geo team is currently overriding this limit

They use **patch-package** to modify the bundle size constant during the build process.

### 3. Dataverse upload size must also be temporarily increased

Because the PCF bundle is stored as a web resource attachment during solution import.

### 4. The deployment pipeline manages this automatically

The upload size limit is increased temporarily and then restored after deployment.

---

# 5. Known Risks

While this approach works and is currently used by the Geo team, there are some risks to consider.

### Tooling dependency

The build process depends on modifying an internal file in the `pcf-scripts` package. If Microsoft changes the internal structure of the package in future versions, the patch may need to be updated.

### Pipeline dependency

The patch must always run during `npm install`. If the patch step fails, the build will fail again with the 5MB bundle error.

### Performance considerations

Larger PCF bundles may increase:

* client-side download size
* page load time
* memory usage within the model-driven app

### Maintenance overhead

Future upgrades to PCF tooling or dependencies may require re-validating the patch.

---

# 6. Proposed Approach for VT

Since the **Geo team is already using this implementation successfully**, VT can adopt the same approach to unblock the current development work.

However, the following actions should be taken:

1. Document the workaround clearly in the repository
2. Track the implementation through a Jira ticket
3. Monitor bundle size growth to avoid excessive increases
4. Re-evaluate long-term architecture if the component size grows significantly

---

# 7. Summary

Two separate size limitations were identified:

| Limit                  | Location                       | Default | Geo Team Approach                       |
| ---------------------- | ------------------------------ | ------- | --------------------------------------- |
| PCF Bundle Size        | `pcf-scripts` build validation | 5MB     | Override using patch-package            |
| Dataverse Upload Limit | Environment attachment setting | 5MB     | Temporarily increased during deployment |

The **Geo team is currently using this approach**, and based on the discussion, **VT can adopt the same implementation with the known risks documented above**.



