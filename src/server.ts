/// <reference lib="webworker" />

import type {
  Ctor,
  Fn,
  KeyVal,
  MessageEventPayload,
  SetupWorkerServerOptions,
  WorkerInterface,
  WrappedMethodFulfilledResultMessageEvent,
  WrappedMethodRejectedResultMessageEvent,
  WrappedMethodRequestMessageEvent,
} from './model.js';

const isWrappedMethodRequestMessageEvent = (
  event: MessageEventPayload,
  wrappedMethods: string[],
): event is MessageEvent<WrappedMethodRequestMessageEvent> =>
  event.data.id &&
  event.data.method &&
  wrappedMethods.includes(event.data.method);

const isCtor = (obj: unknown): obj is Ctor =>
  typeof obj === 'function' && obj.toString().startsWith('class ');

const getInstance = <T extends KeyVal | Fn | Ctor>(
  obj: T,
): T extends Ctor ? InstanceType<T> : T extends Fn ? ReturnType<T> : T => {
  if (typeof obj !== 'function') {
    // FIXME: understand what the heck should this type be
    return obj as any;
  }
  return isCtor(obj) ? new obj() : obj();
};

export const setupWorkerServer = <
  T extends KeyVal | Fn | Ctor,
  U extends WorkerInterface = WorkerInterface,
>(
  methods: T,
  { target = self as unknown as U }: SetupWorkerServerOptions<U> = {},
) => {
  const instance = getInstance(methods);
  const methodsNames = Object.getOwnPropertyNames(
    'constructor' in instance && isCtor(instance.constructor)
      ? Object.getPrototypeOf(instance)
      : instance,
  ).filter(
    name =>
      typeof instance[name as keyof typeof instance] === 'function' &&
      name !== 'constructor',
  );
  target.addEventListener('message', async event => {
    if (!isWrappedMethodRequestMessageEvent(event, methodsNames)) {
      return;
    }
    const { id, method, args } = event.data;
    try {
      const result = await (instance[method as keyof T] as Function)(
        ...(args || []),
      );
      target.postMessage({
        id,
        method,
        args,
        status: 'fulfilled',
        value: result,
      } satisfies WrappedMethodFulfilledResultMessageEvent);
    } catch (error) {
      target.postMessage({
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

  return target;
};

export default setupWorkerServer;
