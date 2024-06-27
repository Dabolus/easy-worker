export type KeyVal = Record<string, any>;

export type Fn = (...args: any[]) => any;

export type Ctor = new (...args: any[]) => any;

export type PromisifiedObject<T extends {}> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : T[K];
};

export type PromisifiedWorker<T extends KeyVal> = Worker & PromisifiedObject<T>;

export interface WorkerServerTarget {
  addEventListener: Worker['addEventListener'];
  postMessage: Worker['postMessage'];
}

export interface WrappedMethodRequestMessageEvent {
  id: string;
  method: string;
  args?: any[];
}

export type WrappedMethodFulfilledResultMessageEvent<T = unknown> =
  WrappedMethodRequestMessageEvent & PromiseFulfilledResult<T>;

export type WrappedMethodRejectedResultMessageEvent =
  WrappedMethodRequestMessageEvent & PromiseRejectedResult;

export interface SetupWorkerClientOptions<T extends KeyVal> {
  timeout?: number;
  getMethodCallId?: (method: keyof T, args: unknown[]) => string;
}

export interface SetupWorkerServerOptions<
  V extends WorkerServerTarget = WorkerServerTarget,
> {
  target?: V;
}
