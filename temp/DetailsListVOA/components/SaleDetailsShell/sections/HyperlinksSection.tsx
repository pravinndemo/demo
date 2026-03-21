import * as React from 'react';
import { Text } from '@fluentui/react';
import { ExternalLinkItem } from '../types';
import { ExternalLinkCard } from '../shared/ExternalLinkCard';

interface HyperlinksSectionProps {
  links: ExternalLinkItem[];
  newTabHintId: string;
}

export const HyperlinksSection: React.FC<HyperlinksSectionProps> = ({ links, newTabHintId }) => (
  <section className="voa-sale-details-card" aria-labelledby="hyperlinks-heading">
    <div className="voa-sale-details-card__header voa-sale-details-card__header--links">
      <Text as="h2" id="hyperlinks-heading" variant="large" className="voa-sale-details-card__title">
        Hyperlinks
      </Text>
      <span className="voa-sale-details-card__meta">External links open in new tab</span>
    </div>

    <div className="voa-hyperlink-layout">
      {links.map((link, index) => (
        <ExternalLinkCard key={link.key} index={index + 1} link={link} newTabHintId={newTabHintId} />
      ))}
    </div>
  </section>
);

HyperlinksSection.displayName = 'HyperlinksSection';
