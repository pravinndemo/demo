import * as React from 'react';
import { DefaultButton, Dropdown, Icon, Text } from '@fluentui/react';
import { PAD_CONFIRMATION_OPTIONS } from '../constants';
import { AttributeChip } from '../types';
import { toReadableLabel } from '../utils';

interface PadSectionProps {
  padStatusDisplay: string;
  padStatusLabel: string;
  isActiveRequestPresent: boolean;
  effectiveDate: string;
  effectiveTo: string;
  plotSize: string;
  attributeGroups: AttributeChip[][];
  vscCodes: string[];
  sourceCodes: string[];
  padConfirmationKey?: string;
  onPadConfirmationChange: (nextKey?: string) => void;
  readOnly?: boolean;
}

export const PadSection: React.FC<PadSectionProps> = ({
  padStatusDisplay,
  padStatusLabel,
  isActiveRequestPresent,
  effectiveDate,
  effectiveTo,
  plotSize,
  attributeGroups,
  vscCodes,
  sourceCodes,
  padConfirmationKey,
  onPadConfirmationChange,
  readOnly = false,
}) => {
  const attributeChips = React.useMemo(
    () => attributeGroups.reduce<AttributeChip[]>((all, group) => all.concat(group), []),
    [attributeGroups],
  );

  return (
    <section className="voa-sale-details-card voa-pad-card" aria-labelledby="pad-heading">
      <div className="voa-sale-details-card__header voa-pad-card__header">
        <div className="voa-pad-heading-wrap">
          <Text as="h2" id="pad-heading" variant="large" className="voa-sale-details-card__title">
            Property Attribute Details
          </Text>
          <div className="voa-pad-top-tags">
            {padStatusDisplay !== '-' && (
              <span className="voa-pad-top-tag voa-pad-top-tag--synced">{padStatusLabel}</span>
            )}
            {isActiveRequestPresent && (
              <span className="voa-pad-top-tag voa-pad-top-tag--warning" title="Sales record is linked to a hereditament with an active request/job in VOS">
                <Icon iconName="Warning" aria-hidden="true" />
                Active request/job in VOS
              </span>
            )}
          </div>
        </div>
        <div className="voa-pad-actions">
          <DefaultButton
            text="Create Data Enhancement Job"
            ariaLabel="Create Data Enhancement Job"
            className="voa-pad-action-btn voa-pad-action-btn--green"
            disabled={readOnly}
          />
          <DefaultButton
            text="View Hereditament"
            ariaLabel="View Hereditament"
            className="voa-pad-action-btn voa-pad-action-btn--blue"
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="voa-pad-table-wrap" role="region" aria-label="Property Attribute Details table">
        <table className="voa-pad-table">
          <thead>
            <tr>
              <th scope="col" className="voa-pad-table__check">✓</th>
              <th scope="col">Effective Date</th>
              <th scope="col">Effective To</th>
              <th scope="col">Status</th>
              <th scope="col">Attributes</th>
              <th scope="col">Value Significant Codes</th>
              <th scope="col">Source Codes</th>
              <th scope="col">Plot Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="voa-pad-table__check" aria-label="Selected row">✓</td>
              <td>{effectiveDate}</td>
              <td>{effectiveTo}</td>
              <td>
                <span
                  className={`voa-pad-status-chip ${padStatusDisplay.toLowerCase() === 'committed' ? 'voa-pad-status-chip--committed' : 'voa-pad-status-chip--default'}`}
                  aria-label={`PAD status: ${padStatusDisplay}`}
                >
                  {padStatusDisplay}
                </span>
              </td>
              <td>
                <div className="voa-pad-attribute-line" role="list" aria-label="Property attributes">
                  {attributeChips.map((chip, index) => (
                    <span
                      key={`${chip.key}-${index}`}
                      className={`voa-pad-attribute-chip voa-pad-attribute-chip--${chip.tone}`}
                      title={chip.tooltip}
                      style={chip.color ? { backgroundColor: chip.color } : undefined}
                      aria-label={chip.tooltip ?? `${toReadableLabel(chip.key)}: ${chip.value}`}
                      role="listitem"
                    >
                      {chip.value}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <div className="voa-pad-code-list">
                  {vscCodes.length > 0
                    ? vscCodes.map((code, idx) => (
                      <span key={`vsc-${idx}`} className="voa-pad-code-chip voa-pad-code-chip--vsc">{code}</span>
                    ))
                    : <span className="voa-pad-code-chip voa-pad-code-chip--empty">-</span>}
                </div>
              </td>
              <td>
                <div className="voa-pad-code-list">
                  {sourceCodes.length > 0
                    ? sourceCodes.map((code, idx) => (
                      <span key={`source-${idx}`} className="voa-pad-code-chip voa-pad-code-chip--source">{code}</span>
                    ))
                    : <span className="voa-pad-code-chip voa-pad-code-chip--empty">-</span>}
                </div>
              </td>
              <td>{plotSize}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="voa-pad-confirmation">
        <label htmlFor="voa-pad-confirmation" className="voa-pad-confirmation__label">PAD Confirmation</label>
        <Dropdown
          id="voa-pad-confirmation"
          placeholder="Select an option"
          options={PAD_CONFIRMATION_OPTIONS}
          selectedKey={padConfirmationKey}
          onChange={(_, option) => onPadConfirmationChange(option?.key as string | undefined)}
          disabled={readOnly}
          ariaLabel="PAD Confirmation"
          className="voa-pad-confirmation__dropdown"
        />
      </div>
    </section>
  );
};

PadSection.displayName = 'PadSection';