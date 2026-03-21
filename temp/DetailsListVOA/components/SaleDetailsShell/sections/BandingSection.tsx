import * as React from 'react';
import { Link, Text } from '@fluentui/react';
import { KvpRow } from '../shared/KvpRow';

interface BandingSectionProps {
  address: string;
  addressLink: string;
  billingAuthority: string;
  band: string;
  bandingEffectiveDate: string;
  composite: string;
  newTabHintId: string;
}

export const BandingSection: React.FC<BandingSectionProps> = ({
  address,
  addressLink,
  billingAuthority,
  band,
  bandingEffectiveDate,
  composite,
  newTabHintId,
}) => (
  <section className="voa-sale-details-card voa-banding-card" aria-labelledby="banding-heading">
    <div className="voa-sale-details-card__header">
      <Text as="h2" id="banding-heading" variant="large" className="voa-sale-details-card__title">
        Hereditament and Banding Details
      </Text>
    </div>

    <div className="voa-banding-layout">
      <div className="voa-banding-layout__column">
        <KvpRow
          label="Address"
          value={
            addressLink ? (
              <Link
                href={addressLink}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open address ${address} in new tab`}
                aria-describedby={newTabHintId}
              >
                {address}
              </Link>
            ) : (
              address
            )
          }
        />
        <KvpRow label="Billing Authority" value={billingAuthority} />
      </div>
      <div className="voa-banding-layout__column">
        <KvpRow label="Band" value={band} />
        <KvpRow label="Banding Effective Date" value={bandingEffectiveDate} />
        <KvpRow label="Composite" value={composite} />
      </div>
    </div>
  </section>
);

BandingSection.displayName = 'BandingSection';
