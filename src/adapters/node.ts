import type { WorkerInterface } from '../model.js';

export interface NodeWorker {
  on(event: 'message', listener: (value: any) => void): this;
  postMessage(value: any): void;
}

export const nodeAdapter = <T extends NodeWorker>(
  nodeWorker: T,
): T & WorkerInterface =>
  Object.assign<T, Pick<WorkerInterface, 'addEventListener'>>(nodeWorker, {
    addEventListener: (_, listener) => {
      const wrappedListener = (data: any) => {
        if ('handleEvent' in listener) {
          listener.handleEvent({ data } as MessageEvent);
        } else {
          listener({ data } as MessageEvent);
        }
      };
      nodeWorker.on('message', wrappedListener);
    },
  });

export default nodeAdapter;
