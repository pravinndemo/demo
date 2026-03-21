import * as React from 'react';
import { DefaultButton, Text } from '@fluentui/react';
import { WlttRecordViewModel } from '../types';
import { KvpRow } from '../shared/KvpRow';
import { RecordNavigator } from '../shared/RecordNavigator';
import { getPromoteToMasterActionRule } from '../rules/ViewSaleActionRules';

interface WlttSectionProps {
  records: WlttRecordViewModel[];
  currentMasterRecordId?: string;
  onPromoteRecord?: (record: WlttRecordViewModel) => void;
  readOnly?: boolean;
}

const normalizeRecordIdentifier = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return '';
  }
  return trimmed.replace(/^\{+|\}+$/g, '').toLowerCase();
};

const isSameRecordIdentifier = (left: string, right: string): boolean => {
  const normalizedLeft = normalizeRecordIdentifier(left);
  const normalizedRight = normalizeRecordIdentifier(right);
  return normalizedLeft !== '' && normalizedLeft === normalizedRight;
};

const EMPTY_WLTT_RECORD: WlttRecordViewModel = {
  wlttId: '-',
  transactionPrice: '-',
  transactionPremium: '-',
  transactionDate: '-',
  groundRent: '-',
  vendors: '-',
  vendees: '-',
  vendorAgents: '-',
  vendeeAgents: '-',
  typeOfProperty: '-',
  tenureType: '-',
  leaseFrom: '-',
  leaseTerm: '-',
  hpiAdjustedPrice: '-',
  ratio: '-',
};

export const WlttSection: React.FC<WlttSectionProps> = ({
  records,
  currentMasterRecordId,
  onPromoteRecord,
  readOnly = false,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    setCurrentIndex(0);
  }, [records.length]);

  const safeIndex = records.length === 0 ? 0 : Math.min(currentIndex, records.length - 1);
  const currentRecord = records[safeIndex] ?? EMPTY_WLTT_RECORD;

  const canPrevious = safeIndex > 0;
  const canNext = safeIndex < records.length - 1;
  const isCurrentMaster = currentMasterRecordId
    ? isSameRecordIdentifier(currentRecord.wlttId, currentMasterRecordId)
    : false;
  const promoteActionRule = getPromoteToMasterActionRule({
    recordCount: records.length,
    isCurrentMaster,
    readOnly,
    hasPromoteHandler: Boolean(onPromoteRecord),
  });

  return (
    <section className="voa-sale-details-card voa-source-card" aria-labelledby="wltt-heading">
      <div className="voa-sale-details-card__header voa-source-card__header">
        <Text as="h2" id="wltt-heading" variant="large" className="voa-sale-details-card__title">
          Stamp Duty Land Tax / Welsh Land Transaction Tax
        </Text>
        <RecordNavigator
          sectionName="WLTT"
          currentIndex={safeIndex}
          total={records.length}
          canPrevious={canPrevious}
          canNext={canNext}
          onPrevious={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
          onNext={() => setCurrentIndex((index) => Math.min(index + 1, records.length - 1))}
        />
      </div>

      <div className="voa-source-card__grid">
        <div className="voa-source-card__column">
          <KvpRow label="ID" value={currentRecord.wlttId} />
          <KvpRow label="Transaction Price" value={currentRecord.transactionPrice} />
          <KvpRow label="Transaction Premium" value={currentRecord.transactionPremium} />
          <KvpRow label="Transaction Date" value={currentRecord.transactionDate} />
          <KvpRow label="Ground Rent" value={currentRecord.groundRent} />
        </div>

        <div className="voa-source-card__column">
          <KvpRow label="Vendor(s)" value={currentRecord.vendors} />
          <KvpRow label="Vendee(s)" value={currentRecord.vendees} />
          <KvpRow label="Vendor Agent(s)" value={currentRecord.vendorAgents} />
          <KvpRow label="Vendee Agent(s)" value={currentRecord.vendeeAgents} />
        </div>

        <div className="voa-source-card__column voa-source-card__column--with-action">
          <KvpRow label="Type of Property" value={currentRecord.typeOfProperty} />
          <KvpRow label="Tenure Type" value={currentRecord.tenureType} />
          <KvpRow label="Lease From" value={currentRecord.leaseFrom} />
          <KvpRow label="Lease Term" value={currentRecord.leaseTerm} />

          <div
            className={`voa-master-status-box ${isCurrentMaster ? 'voa-master-status-box--current' : 'voa-master-status-box--promote'}`}
            role="status"
            aria-live="polite"
          >
            {isCurrentMaster ? (
              <Text className="voa-master-status-box__text">Current Master Record</Text>
            ) : (
              <DefaultButton
                text="Promote Sale to Master"
                ariaLabel="Promote selected WLTT record to master sale"
                className="voa-promote-btn"
                disabled={promoteActionRule.disabled}
                onClick={() => onPromoteRecord?.(currentRecord)}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

WlttSection.displayName = 'WlttSection';

