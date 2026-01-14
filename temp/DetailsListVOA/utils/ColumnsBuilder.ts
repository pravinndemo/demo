import { ColumnConfig } from '../Component.types';
import { SAMPLE_COLUMNS } from '../data/SampleData';

export function buildColumns(
  columnDisplayNames: Record<string, string>,
  columnConfigs: Record<string, ColumnConfig>,
  apiSampleItem?: Record<string, unknown>,
): ComponentFramework.PropertyHelper.DataSetApi.Column[] {
  const cols: ComponentFramework.PropertyHelper.DataSetApi.Column[] = [] as unknown as ComponentFramework.PropertyHelper.DataSetApi.Column[];

  const ensure = (name: string, defaultDisplayName: string, width = 100): void => {
    const lower = name.toLowerCase();
    if (lower === 'completeddate') return;
    if (cols.some((c) => c.name?.toLowerCase() === lower)) return;
    cols.push({
      name,
      displayName: columnDisplayNames[lower] ?? defaultDisplayName,
      dataType: 'SingleLine.Text',
      alias: name,
      order: cols.length + 1,
      visualSizeFactor: width,
    } as ComponentFramework.PropertyHelper.DataSetApi.Column);
  };

  // Config-defined columns
  Object.keys(columnConfigs).forEach((lowerName) => {
    const cfg = columnConfigs[lowerName];
    const colName = (cfg.ColName || lowerName).toLowerCase();
    const display = cfg.ColDisplayName ?? cfg.ColName ?? lowerName;
    const width = typeof cfg.ColWidth === 'number' ? cfg.ColWidth : 100;
    ensure(colName, display, width);
  });

  // If no columns defined via config/profile, fall back to SAMPLE_COLUMNS (manager/qa layout)
  if (cols.length === 0) {
    SAMPLE_COLUMNS.forEach((c) => ensure(c.name, c.displayName, c.width ?? 100));
  }

  // Auto-add fields from API sample item
  if (apiSampleItem) {
    const existing = new Set<string>(cols.map((c) => (c.name ?? '').toLowerCase()));
    Object.keys(apiSampleItem).forEach((key) => {
      const lower = key.toLowerCase();
      if (!existing.has(lower)) {
        const display = key
          .replace(/_/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/^.|\s\w/g, (m) => m.toUpperCase());
        ensure(lower, display);
        existing.add(lower);
      }
    });
  }

  return cols;
}
