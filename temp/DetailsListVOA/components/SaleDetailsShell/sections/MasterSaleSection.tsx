import * as React from 'react';
import { Text } from '@fluentui/react';
import { MasterSaleViewModel } from '../types';
import { KvpRow } from '../shared/KvpRow';

interface MasterSaleSectionProps {
  masterSale: MasterSaleViewModel;
}

const toMultilineValue = (value: string): React.ReactNode => {
  if (value.trim() === '-' || !value.includes('\n')) {
    return value;
  }

  return <span className="voa-master-sale-multiline">{value}</span>;
};

export const MasterSaleSection: React.FC<MasterSaleSectionProps> = ({ masterSale }) => (
  <section className="voa-sale-details-card voa-master-sale-card" aria-labelledby="master-sale-heading">
    <div className="voa-sale-details-card__header">
      <Text as="h2" id="master-sale-heading" variant="large" className="voa-sale-details-card__title">
        Master Sale Details and Calculated Values
      </Text>
    </div>

    <div className="voa-master-sale-grid">
      <div className="voa-master-sale-grid__column">
        <KvpRow label="Sale Price" value={masterSale.salePrice} />
        <KvpRow label="Transaction Date" value={masterSale.transactionDate} />
        <KvpRow label="Model Value" value={masterSale.modelValue} />
      </div>

      <div className="voa-master-sale-grid__column">
        <KvpRow label="Sale Source" value={masterSale.saleSource} />
        <KvpRow label="Overall Flag" value={masterSale.overallFlag} />
        <KvpRow label="Ratio" labelTitle="Ratio = Model Value / HPI Adjusted Price" value={masterSale.ratio} />
      </div>

      <div className="voa-master-sale-grid__column">
        <KvpRow label="Review Flags" value={toMultilineValue(masterSale.reviewFlags)} />
        <KvpRow label="HPI Adjusted Price" value={masterSale.hpiAdjustedPrice} />
        <KvpRow label="Summary Flags" value={toMultilineValue(masterSale.summaryFlags)} />
      </div>
    </div>

    <div className="voa-master-sale-repeat">
      <h3 className="voa-master-sale-repeat__title">Repeat Sales</h3>
      <div className="voa-master-sale-repeat__grid">
        <KvpRow label="Previous Ratio Range" value={masterSale.previousRatioRange} />
        <KvpRow label="Latest Ratio Range" value={masterSale.latestRatioRange} />
      </div>
    </div>
  </section>
);

MasterSaleSection.displayName = 'MasterSaleSection';
