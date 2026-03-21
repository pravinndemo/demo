import * as React from 'react';
import { Icon } from '@fluentui/react';
import { EXTERNAL_LINK_DISABLED_REASON } from '../constants';
import { ExternalLinkItem } from '../types';

interface ExternalLinkCardProps {
  index: number;
  link: ExternalLinkItem;
  newTabHintId: string;
}

export const ExternalLinkCard: React.FC<ExternalLinkCardProps> = ({ index, link, newTabHintId }) => {
  const openLabel = `Open ${link.title} in new tab`;
  const disabledReasonCandidate = link.disabledReason?.trim();
  const disabledReason = disabledReasonCandidate && disabledReasonCandidate.length > 0
    ? disabledReasonCandidate
    : EXTERNAL_LINK_DISABLED_REASON;

  return (
    <article className="voa-link-card" aria-label={`${link.title} link card`}>
      <h3 className="voa-link-card__title">
        <span className="voa-link-card__index" aria-hidden="true">{index}</span>
        <Icon iconName={link.iconName} className="voa-link-card__title-icon" />
        <span>{link.title}</span>
      </h3>
      <p className="voa-link-card__subtitle">{link.subtitle}</p>

      {link.url ? (
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="voa-link-card__button"
          aria-label={openLabel}
          aria-describedby={newTabHintId}
          title={`${openLabel} (opens in new tab)`}
        >
          <Icon iconName="NavigateExternalInline" className="voa-link-card__button-icon" />
          <span>Open in new tab</span>
        </a>
      ) : (
        <span
          className="voa-link-card__button voa-link-card__button--disabled"
          aria-disabled="true"
          aria-label={`${link.title} link unavailable. ${disabledReason}`}
          title={disabledReason}
        >
          <Icon iconName="NavigateExternalInline" className="voa-link-card__button-icon" />
          <span>Link unavailable</span>
        </span>
      )}
    </article>
  );
};

ExternalLinkCard.displayName = 'ExternalLinkCard';

