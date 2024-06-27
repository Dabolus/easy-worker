import type { WorkerInterface } from '../model.js';

export interface NodeWorker {
  on(event: 'message', listener: (value: any) => void): this;
  postMessage(value: any): void;
}

export interface NodeWorkerInterface extends WorkerInterface {
  nodePostMessage(value: any): void;
}

export const nodeAdapter = <T extends NodeWorker>(
  nodeWorker: T,
): T & NodeWorkerInterface =>
  Object.assign<T, Omit<NodeWorkerInterface, 'postMessage'>>(nodeWorker, {
    // Keep the real postMessage method
    nodePostMessage: nodeWorker.postMessage.bind(nodeWorker),
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
