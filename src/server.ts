/// <reference lib="webworker" />

import type {
  WrappedMethodFulfilledResultMessageEvent,
  WrappedMethodRejectedResultMessageEvent,
  WrappedMethodRequestMessageEvent,
} from './model.js';

const isWrappedMethodRequestMessageEvent = (
  event: MessageEvent<any>,
  wrappedMethods: string[],
): event is MessageEvent<WrappedMethodRequestMessageEvent> =>
  event.data.id &&
  event.data.method &&
  wrappedMethods.includes(event.data.method);

export const setupWorkerServer = <T extends Worker, U = Omit<T, keyof Worker>>(
  methods: U,
) => {
  const methodsNames = Object.keys(methods as Record<string, unknown>);
  self.addEventListener('message', async event => {
    if (!isWrappedMethodRequestMessageEvent(event, methodsNames)) {
      return;
    }
    const { id, method, args } = event.data;
    try {
      const result = await (methods[method as keyof U] as Function)(
        ...(args || []),
      );
      self.postMessage({
        id,
        method,
        args,
        status: 'fulfilled',
        value: result,
      } satisfies WrappedMethodFulfilledResultMessageEvent);
    } catch (error) {
      self.postMessage({
        id,
        method,
        args,
        status: 'rejected',
        reason:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause,
              }
            : {
                name: 'UnknownError',
                message: 'Unknown error',
              },
      } satisfies WrappedMethodRejectedResultMessageEvent);
    }
  });

  return methods;
};

export default setupWorkerServer;
