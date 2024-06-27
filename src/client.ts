/// <reference lib="dom" />

import type {
  KeyVal,
  PromisifiedWorker,
  SetupWorkerClientOptions,
  WorkerInterface,
} from './model.js';

export const setupWorkerClient = <
  T extends KeyVal,
  U extends WorkerInterface = WorkerInterface,
>(
  worker: U,
  {
    timeout = 30000,
    getMethodCallId = () => crypto.randomUUID(),
  }: SetupWorkerClientOptions<U> = {},
): PromisifiedWorker<T, U> => {
  const eventsQueueMap: Record<
    string,
    { resolve: Function; reject: Function }
  > = {};

  worker.addEventListener('message', event => {
    const handler = eventsQueueMap[event.data.id];
    if (!handler) {
      return;
    }
    if (event.data.status === 'fulfilled') {
      handler.resolve(event.data.value);
    } else {
      handler.reject(
        Object.assign(new Error(event.data.reason.name), event.data.reason),
      );
    }
  });

  return new Proxy(worker, {
    get(target, property) {
      if (property in target) {
        return target[property as keyof typeof target];
      }
      if (typeof property === 'symbol') {
        return;
      }
      return (...args: unknown[]) =>
        new Promise((resolve, reject) => {
          const id = getMethodCallId(property as keyof U, args);
          const handle = setTimeout(() => {
            delete eventsQueueMap[id];
            reject(new Error('Timeout'));
          }, timeout);
          const wrappedResolve: typeof resolve = (...args) => {
            clearTimeout(handle);
            return resolve(...args);
          };
          eventsQueueMap[id] = { resolve: wrappedResolve, reject };
          worker.postMessage({
            id,
            method: property,
            args,
          });
        });
    },
  }) as PromisifiedWorker<T, U>;
};

export default setupWorkerClient;
