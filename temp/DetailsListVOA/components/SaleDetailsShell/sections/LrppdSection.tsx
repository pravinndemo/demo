import * as React from 'react';
import { DefaultButton, Text } from '@fluentui/react';
import { LrppdRecordViewModel } from '../types';
import { KvpRow } from '../shared/KvpRow';
import { RecordNavigator } from '../shared/RecordNavigator';
import { getPromoteToMasterActionRule } from '../rules/ViewSaleActionRules';

interface LrppdSectionProps {
  records: LrppdRecordViewModel[];
  currentMasterRecordId?: string;
  onPromoteRecord?: (record: LrppdRecordViewModel) => void;
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

const EMPTY_LRPPD_RECORD: LrppdRecordViewModel = {
  lrppdId: '-',
  address: '-',
  transactionPrice: '-',
  typeOfProperty: '-',
  tenureType: '-',
  pricePaidCategory: '-',
  oldNew: '-',
  transactionDate: '-',
  hpiAdjustedPrice: '-',
  ratio: '-',
};

export const LrppdSection: React.FC<LrppdSectionProps> = ({
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
  const currentRecord = records[safeIndex] ?? EMPTY_LRPPD_RECORD;

  const canPrevious = safeIndex > 0;
  const canNext = safeIndex < records.length - 1;
  const isCurrentMaster = currentMasterRecordId
    ? isSameRecordIdentifier(currentRecord.lrppdId, currentMasterRecordId)
    : false;
  const promoteActionRule = getPromoteToMasterActionRule({
    recordCount: records.length,
    isCurrentMaster,
    readOnly,
    hasPromoteHandler: Boolean(onPromoteRecord),
  });

  return (
    <section className="voa-sale-details-card voa-source-card" aria-labelledby="lrppd-heading">
      <div className="voa-sale-details-card__header voa-source-card__header">
        <Text as="h2" id="lrppd-heading" variant="large" className="voa-sale-details-card__title">
          HM Land Registry Price Paid Data
        </Text>
        <RecordNavigator
          sectionName="LRPPD"
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
          <KvpRow label="ID" value={currentRecord.lrppdId} />
          <KvpRow label="Address" value={currentRecord.address} />
          <KvpRow label="Transaction Price" value={currentRecord.transactionPrice} />
        </div>

        <div className="voa-source-card__column">
          <KvpRow label="Type of Property" value={currentRecord.typeOfProperty} />
          <KvpRow label="Tenure Type" value={currentRecord.tenureType} />
          <KvpRow label="Price Paid Category" value={currentRecord.pricePaidCategory} />
        </div>

        <div className="voa-source-card__column voa-source-card__column--with-action">
          <KvpRow label="Old/New" value={currentRecord.oldNew} />
          <KvpRow label="Transaction Date" value={currentRecord.transactionDate} />

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
                ariaLabel="Promote selected HM Land Registry Price Paid Data record to master sale"
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

LrppdSection.displayName = 'LrppdSection';

