import { useCallback, useContext } from 'react';
import { PCFContext } from '../context/PCFContext';
import { executeSearch, mapTaskItemToRecord, type SearchRequest } from '../../services/DataService';
import type { IInputs } from '../../generated/ManifestTypes';

export function useExecuteSearch() {
  const ctx = useContext(PCFContext);
  const run = useCallback(
    async (req: SearchRequest) => {
      if (!ctx) {
        throw new Error('PCF Context not available. Make sure to wrap your component with PCFContext.Provider.');
      }
      return executeSearch(ctx, req);
    },
    [ctx],
  );
  return run;
}

export { mapTaskItemToRecord } from '../../services/DataService';
