import * as React from 'react';
import {
  DefaultButton,
  IconButton,
  Modal,
  SearchBox,
  Spinner,
  SpinnerSize,
  Text,
} from '@fluentui/react';
import { AuditHistoryEntryViewModel, AuditHistoryViewModel } from '../types';

interface AuditHistoryModalProps {
  isOpen: boolean;
  title: string;
  model: AuditHistoryViewModel;
  loading?: boolean;
  onDismiss: () => void;
}

const EMPTY_MODEL: AuditHistoryViewModel = {
  taskId: '-',
  entries: [],
  errorMessage: '',
};

const normalize = (value: string): string => value.trim().toLowerCase();

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  title,
  model,
  loading = false,
  onDismiss,
}) => {
  const safeModel = model ?? EMPTY_MODEL;
  const [searchText, setSearchText] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSearchText('');
  }, [isOpen, title, safeModel.taskId]);

  const filteredEntries = React.useMemo(() => {
    const query = normalize(searchText);
    if (!query) {
      return safeModel.entries;
    }

    return safeModel.entries
      .map((entry) => {
        const metaMatch = [entry.changedBy, entry.changedOn, entry.eventType]
          .some((value) => normalize(value).includes(query));

        const matchingChanges = metaMatch
          ? entry.changes
          : entry.changes.filter((change) => normalize(`${change.fieldName} ${change.oldValue} ${change.newValue}`).includes(query));

        if (!metaMatch && matchingChanges.length === 0) {
          return undefined;
        }

        return {
          ...entry,
          changes: matchingChanges,
        };
      })
      .filter((entry): entry is AuditHistoryEntryViewModel => Boolean(entry));
  }, [safeModel.entries, searchText]);

  const totalEntries = safeModel.entries.length;
  const totalChanges = safeModel.entries.reduce((sum, entry) => sum + entry.changes.length, 0);
  const visibleEntries = filteredEntries.length;
  const visibleChanges = filteredEntries.reduce((sum, entry) => sum + entry.changes.length, 0);
  const isFiltered = normalize(searchText).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      isBlocking
      containerClassName="voa-audit-modal"
      titleAriaId="voa-audit-modal-title"
    >
      <div className="voa-audit-topbar">
        <div className="voa-audit-topbar__row1">
          <DefaultButton
            text="Back"
            iconProps={{ iconName: 'Back' }}
            onClick={onDismiss}
            ariaLabel="Close audit history"
            className="voa-audit-topbar__back"
          />
          <Text as="h2" id="voa-audit-modal-title" className="voa-audit-topbar__title">
            {title}
          </Text>
          <IconButton
            iconProps={{ iconName: 'Cancel' }}
            ariaLabel="Close audit history"
            onClick={onDismiss}
            className="voa-audit-topbar__close"
          />
        </div>

        <div className="voa-audit-topbar__row2">
          <div className="voa-audit-topbar__meta">
            <Text className="voa-audit-topbar__task-id">Task Id: {safeModel.taskId || '-'}</Text>
            <div className="voa-audit-kpis" aria-live="polite">
              <span className="voa-audit-kpi">Entries: {visibleEntries.toLocaleString('en-GB')}</span>
              <span className="voa-audit-kpi">Changes: {visibleChanges.toLocaleString('en-GB')}</span>
              {isFiltered ? <span className="voa-audit-kpi voa-audit-kpi--filtered">Filtered</span> : null}
            </div>
            <Text className="voa-audit-topbar__status">
              Showing {visibleEntries.toLocaleString('en-GB')} of {totalEntries.toLocaleString('en-GB')} entries and {visibleChanges.toLocaleString('en-GB')} of {totalChanges.toLocaleString('en-GB')} changes.
            </Text>
          </div>

          <div className="voa-audit-topbar__search">
            <SearchBox
              placeholder="Search field, value, user, or event"
              value={searchText}
              onChange={(_, value) => setSearchText(value ?? '')}
              onClear={() => setSearchText('')}
              ariaLabel="Filter audit history"
            />
          </div>
        </div>
      </div>

      <div className="voa-audit-scroll-region">
        {loading ? (
          <div className="voa-audit-modal__loading" role="status" aria-live="polite">
            <Spinner size={SpinnerSize.medium} />
            <span>Loading audit history...</span>
          </div>
        ) : (
          <div className="voa-audit-modal__entries">
            {safeModel.errorMessage ? (
              <div className="voa-audit-modal__error" role="alert">
                {safeModel.errorMessage}
              </div>
            ) : null}

            {filteredEntries.length === 0 && !safeModel.errorMessage ? (
              <div className="voa-audit-modal__empty" role="status" aria-live="polite">
                {isFiltered ? 'No matching audit history found for the current search.' : 'No audit history records found.'}
              </div>
            ) : null}

            {filteredEntries.map((entry) => (
              <article className="voa-audit-entry" key={entry.changeId}>
                <div className="voa-audit-entry__meta" aria-label={`Changed by ${entry.changedBy} on ${entry.changedOn}`}>
                  <span><strong>Changed By:</strong> {entry.changedBy}</span>
                  <span><strong>Changed On:</strong> {entry.changedOn}</span>
                  {entry.eventType && entry.eventType !== '-' ? (
                    <span><strong>Event:</strong> {entry.eventType}</span>
                  ) : null}
                </div>

                <div className="voa-audit-entry__table-wrap">
                  <table className="voa-audit-entry__table">
                    <thead>
                      <tr>
                        <th scope="col">Changed Field</th>
                        <th scope="col">Old Value</th>
                        <th scope="col">New Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.changes.map((change, index) => (
                        <tr key={`${entry.changeId}-${change.fieldName}-${index}`}>
                          <th scope="row">{change.fieldName}</th>
                          <td>{change.oldValue}</td>
                          <td>{change.newValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

AuditHistoryModal.displayName = 'AuditHistoryModal';
