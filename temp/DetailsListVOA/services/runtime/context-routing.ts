import { IInputs } from '../../generated/ManifestTypes';
import { CONTROL_CONFIG } from '../../config/ControlConfig';
import { normalizeTextValue } from './text';
import { HOME_JOURNEY_HOME_SCREEN_HINTS, HOME_JOURNEY_WORKSPACE_SCREEN_HINTS } from '../../constants/HomeJourney';

export interface JourneyContext {
  country: string;
  listYear: string;
}

export interface SharePointCatalogChunks {
  optionsJson: string;
  recordsJson1: string;
  recordsJson2: string;
}

const resolveInputText = (context: ComponentFramework.Context<IInputs>, paramName: string): string => {
  const raw = (context.parameters as unknown as Record<string, { raw?: string }>)[paramName]?.raw;
  return normalizeTextValue(raw);
};

const resolveInputCountry = (context: ComponentFramework.Context<IInputs>): string =>
  resolveInputText(context, 'country');

const resolveInputListYear = (context: ComponentFramework.Context<IInputs>): string =>
  resolveInputText(context, 'listYear');

export const resolveSharePointCatalogChunks = (context: ComponentFramework.Context<IInputs>): SharePointCatalogChunks => ({
  optionsJson: resolveInputText(context, 'sharePointOptionsJson'),
  recordsJson1: resolveInputText(context, 'sharePointRecordsJson1'),
  recordsJson2: resolveInputText(context, 'sharePointRecordsJson2'),
});

export const normalizeJourneyContext = (args: { country: string; listYear: string }): JourneyContext => ({
  country: normalizeTextValue(args?.country),
  listYear: normalizeTextValue(args?.listYear),
});

export const isManagerHomeJourneyScreen = (context: ComponentFramework.Context<IInputs>): boolean => {
  const raw = (context.parameters as unknown as Record<string, { raw?: string }>).canvasScreenName?.raw;
  const normalized = normalizeTextValue(raw).toLowerCase();

  if (!normalized) {
    return true;
  }

  if (HOME_JOURNEY_HOME_SCREEN_HINTS.some((hint) => normalized.includes(hint))) {
    return true;
  }

  return HOME_JOURNEY_WORKSPACE_SCREEN_HINTS.some((hint) => normalized.includes(hint));
};

export const resolveActiveRequestContext = (
  context: ComponentFramework.Context<IInputs>,
  managerJourneyActive: boolean,
  managerJourneyContext?: JourneyContext,
): JourneyContext => {
  const fallbackCountry = resolveInputCountry(context);
  const fallbackListYear = resolveInputListYear(context);

  if (!managerJourneyActive) {
    return {
      country: fallbackCountry,
      listYear: fallbackListYear,
    };
  }

  const journeyCountry = normalizeTextValue(managerJourneyContext?.country);
  const journeyListYear = normalizeTextValue(managerJourneyContext?.listYear);
  return {
    country: journeyCountry || fallbackCountry,
    listYear: journeyListYear || fallbackListYear,
  };
};

export const isPcfViewSalesDetailsEnabled = (context: ComponentFramework.Context<IInputs>): boolean => {
  const raw = (context.parameters as unknown as Record<string, { raw?: boolean | string }>).enablePcfViewSalesDetails?.raw;
  if (typeof raw === 'boolean') {
    return raw;
  }
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }
  }
  return CONTROL_CONFIG.enablePcfViewSalesDetails === true;
};
