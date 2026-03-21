import * as React from 'react';

interface KvpRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  labelTitle?: string;
}

export const KvpRow: React.FC<KvpRowProps> = ({ label, value, labelTitle }) => (
  <div className="voa-kvp-row">
    <span className="voa-kvp-row__label" title={labelTitle}>{label}</span>
    <span className="voa-kvp-row__value">{value}</span>
  </div>
);

KvpRow.displayName = 'KvpRow';
