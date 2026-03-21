import * as React from 'react';
import { formatValue, toInitials } from '../utils';

export const OwnershipRow = ({ label, value }: { label: string; value: string }): JSX.Element => {
  const displayValue = formatValue(value);

  return (
    <div className="voa-ownership-row">
      <span className="voa-ownership-row__label">{label}</span>
      <span className="voa-avatar" aria-hidden="true">{toInitials(displayValue)}</span>
      <span className="voa-ownership-row__name">{displayValue}</span>
    </div>
  );
};

OwnershipRow.displayName = 'OwnershipRow';
