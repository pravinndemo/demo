import { IInputs } from '../generated/ManifestTypes';

interface WebApiExecutor {
  execute?: (req: unknown) => Promise<Response>;
}

interface XrmLike {
  WebApi?: {
    execute?: (req: unknown) => Promise<Response>;
    online?: { execute?: (req: unknown) => Promise<Response> };
  };
}

const getWebApiExecutor = (context: ComponentFramework.Context<IInputs>): WebApiExecutor => {
  const webApi = (context as unknown as { webAPI?: WebApiExecutor }).webAPI;
  if (webApi?.execute) return webApi;
  const xrm = (globalThis as unknown as { Xrm?: XrmLike }).Xrm;
  if (xrm?.WebApi?.online?.execute) {
    return xrm.WebApi.online;
  }
  if (xrm?.WebApi?.execute) {
    return xrm.WebApi;
  }
  return {};
};

export const buildUnboundCustomApiRequest = (
  operationName: string,
  params: Record<string, string>,
): Record<string, unknown> & {
  getMetadata: () => {
    boundParameter: null;
    parameterTypes: Record<string, { typeName: string; structuralProperty: number }>;
    operationType: number;
    operationName: string;
  };
} => {
  const request: Record<string, unknown> & {
    getMetadata: () => {
      boundParameter: null;
      parameterTypes: Record<string, { typeName: string; structuralProperty: number }>;
      operationType: number;
      operationName: string;
    };
  } = {
    getMetadata: () => ({
      boundParameter: null,
      parameterTypes: Object.keys(params).reduce((acc, key) => {
        acc[key] = { typeName: 'Edm.String', structuralProperty: 1 };
        return acc;
      }, {} as Record<string, { typeName: string; structuralProperty: number }>),
      operationType: 0,
      operationName,
    }),
  };
  Object.entries(params).forEach(([key, value]) => {
    request[key] = value;
  });
  return request;
};

export const executeUnboundCustomApi = async <T>(
  context: ComponentFramework.Context<IInputs>,
  operationName: string,
  params: Record<string, string>,
): Promise<T> => {
  const executor = getWebApiExecutor(context);
  if (!executor.execute) {
    throw new Error('Web API execute is not available in this environment');
  }
  const request = buildUnboundCustomApiRequest(operationName, params);
  const result = await executor.execute(request);
  return (await result.json()) as T;
};
