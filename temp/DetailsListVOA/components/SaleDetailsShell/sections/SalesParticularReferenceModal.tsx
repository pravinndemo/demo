import * as React from 'react';
import {
  Dropdown,
  Icon,
  IconButton,
  IDropdownOption,
  Link,
  Modal,
  Text,
} from '@fluentui/react';
import { SalesParticularReferenceImageViewModel } from '../types';
import { toReadableLabel } from '../utils';

interface SalesParticularReferenceModalProps {
  isOpen: boolean;
  attributeKey?: string;
  references: SalesParticularReferenceImageViewModel[];
  onDismiss: () => void;
}

const EMPTY_OPTIONS: IDropdownOption[] = [{ key: 'none', text: 'No categories' }];

const normalize = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const matchesAttribute = (candidate: string, attributeKey: string): boolean => {
  const left = normalize(candidate);
  const right = normalize(attributeKey);

  if (!right) {
    return true;
  }

  if (!left || left === 'all' || left === 'any') {
    return true;
  }

  return left === right;
};

const toCategoryOptions = (records: SalesParticularReferenceImageViewModel[]): IDropdownOption[] => {
  const seen = new Set<string>();
  const options: IDropdownOption[] = [];

  records.forEach((record) => {
    const key = record.category.trim();
    if (!key || seen.has(key.toLowerCase())) {
      return;
    }
    seen.add(key.toLowerCase());
    options.push({ key, text: key });
  });

  return options.length > 0 ? options : EMPTY_OPTIONS;
};

export const SalesParticularReferenceModal: React.FC<SalesParticularReferenceModalProps> = ({
  isOpen,
  attributeKey,
  references,
  onDismiss,
}) => {
  const scopedReferences = React.useMemo(() => {
    if (!attributeKey) {
      return references;
    }
    return references.filter((reference) => matchesAttribute(reference.attributeKey, attributeKey));
  }, [attributeKey, references]);

  const categoryOptions = React.useMemo(() => toCategoryOptions(scopedReferences), [scopedReferences]);

  const [compareCategory, setCompareCategory] = React.useState<string | undefined>(undefined);
  const [withCategory, setWithCategory] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const firstCategory = categoryOptions[0]?.key as string | undefined;
    const secondCategory = categoryOptions[1]?.key as string | undefined;

    setCompareCategory(firstCategory);
    setWithCategory(secondCategory ?? firstCategory);
  }, [categoryOptions, attributeKey, isOpen]);

  const compareItems = React.useMemo(
    () => scopedReferences.filter((reference) => reference.category === compareCategory),
    [compareCategory, scopedReferences],
  );

  const withItems = React.useMemo(
    () => scopedReferences.filter((reference) => reference.category === withCategory),
    [scopedReferences, withCategory],
  );

  const sectionLabel = attributeKey ? toReadableLabel(attributeKey) : 'Reference Images';

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      isBlocking={false}
      containerClassName="voa-reference-modal"
      titleAriaId="voa-reference-modal-title"
    >
      <div className="voa-reference-modal__header">
        <Text as="h2" id="voa-reference-modal-title" className="voa-reference-modal__title">
          {sectionLabel} Reference Images
        </Text>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          ariaLabel="Close reference image popup"
          onClick={onDismiss}
          className="voa-reference-modal__close"
        />
      </div>

      {scopedReferences.length === 0 ? (
        <div className="voa-reference-modal__empty" role="status" aria-live="polite">
          No reference images found for this attribute.
        </div>
      ) : (
        <div className="voa-reference-modal__content">
          <section className="voa-reference-column" aria-label="Compare images">
            <div className="voa-reference-column__toolbar">
              <Text className="voa-reference-column__toolbar-label">Compare</Text>
              <Dropdown
                options={categoryOptions}
                selectedKey={compareCategory}
                onChange={(_, option) => setCompareCategory(option?.key as string | undefined)}
                ariaLabel="Compare category"
                className="voa-reference-column__dropdown"
              />
            </div>

            <div className="voa-reference-column__list">
              {compareItems.map((item) => (
                <article key={item.id} className="voa-reference-card">
                  <Text className="voa-reference-card__category">{item.category}</Text>
                  <Text className="voa-reference-card__title">{item.title}</Text>
                  {item.sourceUrl && (
                    <Link href={item.sourceUrl} target="_blank" rel="noreferrer" className="voa-reference-card__link">
                      {item.sourceUrl}
                    </Link>
                  )}
                  <div className="voa-reference-card__image-wrap">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="voa-reference-card__image" loading="lazy" />
                    ) : (
                      <div className="voa-reference-card__placeholder" role="img" aria-label={`${item.title} image unavailable`}>
                        <Icon iconName="Photo2" aria-hidden />
                        <span>Image unavailable</span>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="voa-reference-column" aria-label="With images">
            <div className="voa-reference-column__toolbar">
              <Text className="voa-reference-column__toolbar-label">With</Text>
              <Dropdown
                options={categoryOptions}
                selectedKey={withCategory}
                onChange={(_, option) => setWithCategory(option?.key as string | undefined)}
                ariaLabel="With category"
                className="voa-reference-column__dropdown"
              />
            </div>

            <div className="voa-reference-column__list">
              {withItems.map((item) => (
                <article key={`with-${item.id}`} className="voa-reference-card">
                  <Text className="voa-reference-card__category">{item.category}</Text>
                  <Text className="voa-reference-card__title">{item.title}</Text>
                  {item.sourceUrl && (
                    <Link href={item.sourceUrl} target="_blank" rel="noreferrer" className="voa-reference-card__link">
                      {item.sourceUrl}
                    </Link>
                  )}
                  <div className="voa-reference-card__image-wrap">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="voa-reference-card__image" loading="lazy" />
                    ) : (
                      <div className="voa-reference-card__placeholder" role="img" aria-label={`${item.title} image unavailable`}>
                        <Icon iconName="Photo2" aria-hidden />
                        <span>Image unavailable</span>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
};

SalesParticularReferenceModal.displayName = 'SalesParticularReferenceModal';
