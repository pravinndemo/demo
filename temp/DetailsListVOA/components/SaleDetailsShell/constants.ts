import { IDropdownOption } from '@fluentui/react';
import { StatusTone } from './types';

export const NEW_TAB_HINT_ID = 'svt-sale-details-new-tab-hint';
export const EXTERNAL_LINK_DISABLED_REASON = 'Insufficient property data to open link';

export const EXTERNAL_LINK_URL_PARTS = {
  vmsCenterBase: 'https://geo-dev-vms-4x.voa.ns3n.corp.hmrc.gov.uk/?center=',
  vmsSpatialReferenceSuffix: ',27700',
  vmsZoomLevelSuffix: '&level=13#',
  zooplaBase: 'https://www.zoopla.co.uk/house-prices/',
  rightmoveBase: 'https://www.rightmove.co.uk/house-prices/',
  rightmoveSuffix: '.html?page=1',
  epcBase: 'https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?postcode=',
} as const;

export const PAD_CONFIRMATION_OPTIONS: IDropdownOption[] = [
  { key: 'confirmed', text: 'Confirmed' },
  { key: 'needs-update', text: 'Needs update' },
  { key: 'further-review', text: 'Further review' },
];

export const statusIconByTone: Record<StatusTone, string> = {
  critical: 'ErrorBadge',
  warning: 'Warning',
  ok: 'SkypeCircleCheck',
  neutral: 'StatusCircleRing',
};

