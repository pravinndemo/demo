# Caseworker View Test Checklist

## Test Metadata
| Field | Value |
|---|---|
| Build/Version | |
| Environment | |
| Screen | My Allocated Sales |
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

## Prefilter Checklist (Caseworker View)
- [ ] PF-CW-01 Prefilter bar is visible and can be collapsed/expanded after apply.
- [ ] PF-CW-02 Search by field is not shown on Caseworker View.
- [ ] PF-CW-03 Owner selector is hidden (current user is implicit).
- [ ] PF-CW-04 Work That options are: Is assigned to me; I have completed; Is assigned to me but is awaiting or undergoing QC.
- [ ] PF-CW-05 Completed date range is required only for "I have completed".
- [ ] PF-CW-06 "From date" cannot be in the future; error shown if it is.
- [ ] PF-CW-07 "From date" auto-sets "To date" to min(from + 14 days, today).
- [ ] PF-CW-08 Search is disabled until required fields are set (work that, and from date when required).
- [ ] PF-CW-09 "Clear search" resets prefilter to defaults and clears stored prefilter state.

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
