# Prefilter, Column Filter, and Sorting Test Checklist

## Test Metadata
| Field | Value |
|---|---|
| Build/Version | |
| Environment | |
| Screen | |
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

## Prefilter Checklist
- [ ] PF-01 Prefilter panel show/hide toggle works and maintains state after applying a prefilter.
- [ ] PF-02 Search button stays disabled until required fields are set (owner, work that, and completed date when required).
- [ ] PF-03 Selecting a future "From date" shows error "Start date cannot be in the future".
- [ ] PF-04 "From date" auto-sets "To date" to min(from + 14 days, today).
- [ ] PF-05 Changing "Search by" clears Work That and completed date range as expected.
- [ ] PF-06 "Clear search" resets to screen defaults and removes stored prefilter state.

## Prefilter: Manager Assignment
- [ ] PF-MA-01 "Search by" options are Billing Authority and Caseworker.
- [ ] PF-MA-02 Billing Authority search shows Billing Authority selector with All; Caseworker field is hidden.
- [ ] PF-MA-03 Caseworker search shows Caseworker selector with All; Billing Authority field is hidden.
- [ ] PF-MA-04 Work That options for Billing Authority search: Is ready to allocate; Is currently assigned; Has been complete; Is awaiting or undergoing QC.
- [ ] PF-MA-05 Work That options for Caseworker search: Is assigned to the selected user(s); Has been completed by the selected user(s); Is assigned to the selected user(s) but is awaiting or undergoing QC.
- [ ] PF-MA-06 Completed date range is required only for "Has been complete" and "Has been completed by the selected user(s)".

## Prefilter: Caseworker View
- [ ] PF-CW-01 Default "Search by" is Caseworker; Work That defaults to "Is assigned to me".
- [ ] PF-CW-02 Work That options are: Is assigned to me; I have completed; Is assigned to me but is awaiting or undergoing QC.
- [ ] PF-CW-03 Completed date range is required only for "I have completed".

## Prefilter: QC Assignment
- [ ] PF-QA-01 "Search by" options are QC User, Task, Caseworker.
- [ ] PF-QA-02 Task search hides the owner selector and still allows Search.
- [ ] PF-QA-03 QC User uses QC user options; Caseworker uses caseworker options; both support All.
- [ ] PF-QA-04 Work That options for QC User search: Is assigned to the selected user(s); Has been completed by the selected user(s); Is assigned to the selected user(s) but is being progressed by the caseworker.
- [ ] PF-QA-05 Work That options for Caseworker search: Has been complete by the selected caseworker where QC has been requested; Has been complete by the selected caseworker.
- [ ] PF-QA-06 Work That options for Task search: Has been complete by a caseworker where QC has been requested; Has been complete by a caseworker.
- [ ] PF-QA-07 Completed date range is required only for completed options (QC Completed, Caseworker Completed, Task Completed).

## Prefilter: QC View
- [ ] PF-QV-01 Owner field is hidden.
- [ ] PF-QV-02 Work That options are: Is assigned to me; I have completed; Is assigned to me but is being progressed by the caseworker.
- [ ] PF-QV-03 Completed date range is required only for "I have completed".

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
