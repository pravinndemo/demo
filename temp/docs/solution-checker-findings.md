# Solution Checker Findings

Date: 2026-02-11
Rescan: 2026-02-11 (after local rebuild)

## Scope
Reviewed local sources under `DetailsListVOA` and `VOA.SVT.Plugins`, plus the generated PCF bundle at `out/controls/DetailsListVOA/bundle.js`. The rescan results were unchanged: the bundle still embeds `react-dom.development.js`, so vendor dev-only checks remain present.

## innerHTML / outerHTML
Finding: Present only in the vendor `react-dom` development bundle.  
Source: `node_modules/react-dom/cjs/react-dom.development.js` (embedded in `out/controls/DetailsListVOA/bundle.js`).  
Impact: Vendor implementation detail for DOM rendering. Not used by project source code.

## window.top / window.parent.parent
Finding: Only explicit `window.top` reference is in the `react-dom` development bundle (DevTools detection).  
No `window.parent` or `window.parent.parent` references found in project sources or the bundle.  
The reported `c.top` / `e.top` / `k.top` patterns are consistent with minified vendor geometry code (e.g., DOMRect `top`) and are false positives for `window.top`.

## MSApp.execUnsafeLocalFunction
Finding: Present only in the vendor `react-dom` development bundle and guarded by runtime checks.  
Impact: Vendor legacy path; not used by project source code.

## Non-strict Equality (== / !=)
Finding: Non-strict equality appears only in bundled vendor modules, not in project source code.  
Examples include `@fluentui/*`, `prop-types`, `react-dom` (dev), and `tslib`.

## Insecure Protocols (http / ftp)
Finding: Only `http://` occurrences are XML namespace declarations in solution/project files.  
Examples: `DetailsListVOA.pcfproj` and `solution/src/Other/*.xml`.  
No runtime URLs or `ftp://` occurrences found in project code.
