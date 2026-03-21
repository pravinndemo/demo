# WRT-197 - View Hereditament and Banding Details

## Story intent
Show Hereditament and Banding information inside the Sale Record details page.

This is a details-information section and should be available for any persona that can open Sale Record details (including Caseworker).

## Acceptance criteria

### AC1: Section visibility and placement
Given I can open a Sale Record
When I select `View Sales Record`
Then I can see a section titled `Hereditament and Banding Details`
And it appears below the `Hyperlinks` section.

Section order:
1. Sales Verification Task Details
2. Hyperlinks
3. Hereditament and Banding Details

### AC2: Field content and behavior
The section shows these read-only fields in two columns:

| Field name | Data type | Action | Notes |
| --- | --- | --- | --- |
| Address | Text | Read-only link | Full address string including postcode. Opens the hereditament in VOS in a new tab. |
| Billing Authority | Text | Read-only | |
| Band | Text | Read-only | |
| Banding Effective Date | Date | Read-only | `DD/MM/YYYY` |
| Composite | Text | Read-only | |

### AC3: Address link construction
Address uses the following URL pattern:

```text
{FxEnvironmentURL}/main.aspx?appid=cdb5343c-51c1-ec11-983e-002248438fff&newWindow=true&pagetype=entityrecord&etn=voa_ssu&id={suId}&formid=4176b880-fcc3-4ee7-b915-ab163011bbcb
```

Where:
- `suId` comes from the selected sale-record payload.
- `FxEnvironmentURL` comes from a PCF input property.

### AC4: Styling and layout flexibility
The story does not limit visual styling beyond placement and field visibility.
The section may use any compliant styling, provided readability and accessibility are preserved.
