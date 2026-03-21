import * as React from 'react';
import { IconButton, Text } from '@fluentui/react';

interface RecordNavigatorProps {
  sectionName: string;
  currentIndex: number;
  total: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export const RecordNavigator: React.FC<RecordNavigatorProps> = ({
  sectionName,
  currentIndex,
  total,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
}) => (
  <div className="voa-record-nav" role="group" aria-label={`${sectionName} record navigation`}>
    <Text className="voa-record-nav__count" variant="medium" aria-live="polite">
      {`Record count ${total > 0 ? currentIndex + 1 : 0} of ${total}`}
    </Text>
    <div className="voa-record-nav__buttons">
      <IconButton
        iconProps={{ iconName: 'ChevronLeftMed' }}
        className="voa-record-nav__btn voa-record-nav__btn--prev"
        ariaLabel={`Previous ${sectionName} record`}
        disabled={!canPrevious}
        onClick={onPrevious}
      />
      <IconButton
        iconProps={{ iconName: 'ChevronRightMed' }}
        className="voa-record-nav__btn voa-record-nav__btn--next"
        ariaLabel={`Next ${sectionName} record`}
        disabled={!canNext}
        onClick={onNext}
      />
    </div>
  </div>
);

RecordNavigator.displayName = 'RecordNavigator';
