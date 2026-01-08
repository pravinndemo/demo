import { SAMPLE_COLUMNS, SAMPLE_RECORDS, SampleRecord } from '../data/SampleData';

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
  return '';
}

export function ensureSampleColumns(
  datasetColumns: ComponentFramework.PropertyHelper.DataSetApi.Column[],
  columnDisplayNames: Record<string, string>,
): void {
  const ensureColumn = (
    name: string,
    defaultDisplayName: string,
    width = 100,
    cellType?: string,
  ): void => {
    const lowerName = name.toLowerCase();
    if (datasetColumns.some((col) => col.name.toLowerCase() === lowerName)) {
      return;
    }
    datasetColumns.push({
      name,
      displayName: columnDisplayNames[lowerName] ?? defaultDisplayName,
      dataType: 'SingleLine.Text',
      alias: name,
      order: datasetColumns.length + 1,
      visualSizeFactor: width,
      cellType,
    } as ComponentFramework.PropertyHelper.DataSetApi.Column & { cellType?: string });
  };

  SAMPLE_COLUMNS.forEach((c) => ensureColumn(c.name, c.displayName, c.width ?? 100, c.cellType));
}

export function buildSampleEntityRecords(): {
  records: Record<string, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord>;
  ids: string[];
} {
  const records: Record<string, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord> = {};
  const ids: string[] = [];

  const makeRecord = (sample: SampleRecord, index: number) => {
    const base: Record<string, unknown> = {};
    const rec = base as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & Record<string, unknown>;
    rec.getRecordId = () => `sample-${index}`;
    rec.getNamedReference = undefined as unknown as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord['getNamedReference'];
    rec.getValue = ((columnName: string) => rec[columnName] ?? '') as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord['getValue'];
    rec.getFormattedValue = ((columnName: string) => toText(rec[columnName])) as ComponentFramework.PropertyHelper.DataSetApi.EntityRecord['getFormattedValue'];
    Object.keys(sample).forEach((k) => {
      // Preserve provided keys as-is for visibility; callers can add lowercase aliases if needed
      rec[k] = (sample as Record<string, unknown>)[k];
    });
    return rec;
  };

  SAMPLE_RECORDS.forEach((s, i) => {
    const r = makeRecord(s, i);
    const id = r.getRecordId();
    records[id] = r;
    ids.push(id);
  });

  return { records, ids };
}

