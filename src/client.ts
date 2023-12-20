/// <reference lib="dom" />

import type { PromisifiedWorker, SetupWorkerClientOptions } from './model.js';

export const setupWorkerClient = <T extends Worker, U = Omit<T, keyof Worker>>(
  worker: Worker,
  methods: (keyof U)[],
  {
    timeout = 30000,
    getMethodCallId = () => Math.random().toString(36).slice(2),
  }: SetupWorkerClientOptions<T, U> = {},
): PromisifiedWorker<T> => {
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

  return Object.assign(
    worker,
    Object.fromEntries(
      methods.map(method => [
        method,
        (...args: unknown[]) =>
          new Promise((resolve, reject) => {
            const id = getMethodCallId(method, args);
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
              method,
              args,
            });
          }),
      ]),
    ),
  ) as PromisifiedWorker<T>;
};

export default setupWorkerClient;
