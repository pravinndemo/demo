# Sales Record Search Test Checklist

## Test Metadata
| Field | Value |
|---|---|
| Build/Version | |
| Environment | |
| Screen | Sales Record Search |
| Table Key | |
| Tester | |
| Date | |
| Data Set | |
| Notes | |

## Data Prerequisites
- [ ] Dataset includes at least 2 rows per sortable field and at least 1 row with blanks/nulls for those fields.
- [ ] Date fields include both ISO (YYYY-MM-DD) and UK (DD/MM/YYYY) formats.
- [ ] Billing Authority has at least 4 distinct values to verify the 3-selection limit.
- [ ] Records cover all "Work That" status groups used by the screen under test.
- [ ] For flagged/review fields, dataset includes both true and false cases.

## Prefilter Checklist (Sales Record Search)
- [ ] PF-SS-01 Prefilter bar is not shown on Sales Record Search (prefilters are not applicable on this screen).

## Column Filter Coverage
| Column Field | Control | Notes |
|---|---|---|
| saleid | text | min length 1 |
| taskid | text | min length 3 |
| uprn | text | min length 1 |
| address | text contains | min length 3 |
| postcode | text prefix | min length 2 |
| billingauthority | multi-select | limit 3 |
| transactiondate | date range | |
| saleprice | numeric | |
| ratio | numeric | |
| dwellingtype | multi-select | supports All |
| flaggedforreview | single-select | true/false |
| reviewflags | multi-select | supports All |
| outlierratio | numeric | |
| overallflag | multi-select | explicit options list |
| summaryflag | text contains | min length 2 |
| summaryflags | text contains | min length 2 |
| taskstatus | multi-select | supports All |
| assignedto | single-select | |
| assigneddate | date range | |
| taskcompleteddate | date range | |
| qcassignedto | single-select | |
| qcassigneddate | date range | |
| qccompleteddate | date range | |

## Column Filter Checklist
- [ ] CF-01 Column menu shows the correct control type for the column (text, numeric, date range, single-select, multi-select).
- [ ] CF-02 Applying a filter updates results and shows an active filter state in the header.
- [ ] CF-03 Clearing a filter removes it and restores results.
- [ ] CF-04 Multiple column filters combine as AND.
- [ ] CF-05 Min-length validation blocks apply for taskid (3), address (3), postcode (2), summaryflag (2), summaryflags (2).
- [ ] CF-06 Multi-select All behavior works for dwellingtype, reviewflags, overallflag, taskstatus.
- [ ] CF-07 billingauthority enforces 3-selection limit and keeps the most recent 3 selections.
- [ ] CF-08 flaggedforreview true and false filters return the expected rows.
- [ ] CF-09 Numeric filters support >=, <=, and between; partial between acts as >= or <=.
- [ ] CF-10 Date range filters are inclusive; same start/end date is valid.
- [ ] CF-11 Filters persist per table across reload and Clear column filters removes all filters.

## Sorting Coverage
| Data Type | Columns |
|---|---|
| Date | transactiondate, assigneddate, taskcompleteddate, qcassigneddate, qccompleteddate |
| Numeric | saleprice, ratio, outlierratio |
| Text/ID | saleid, taskid, uprn, address, postcode, billingauthority, dwellingtype, taskstatus, assignedto, qcassignedto, summaryflag, summaryflags, overallflag, reviewflags |

## Sorting Checklist
- [ ] S-01 Sort Asc/Desc is available only on sortable columns.
- [ ] S-02 Sorting changes the row order and updates the header icon/aria label.
- [ ] S-03 Sorting persists per table across reload and resets when switching tables.
- [ ] S-04 Sorting with active column filters preserves both filter and order.
- [ ] S-05 Date sorting is chronological for ISO and UK formats; blanks sort first in ascending.
- [ ] S-06 Numeric sorting treats numbers correctly (e.g., 2 before 10).
- [ ] S-07 Text/ID sorting is case-insensitive.
- [ ] S-08 Pagination respects the selected sort order across pages.

## Results Capture Template
| Test ID | Screen | Input / Steps | Expected | Actual | Pass/Fail | Notes |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |
