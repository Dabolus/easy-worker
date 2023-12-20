export type PromisifiedObject<T extends {}> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : T[K];
};

export type PromisifiedWorker<T extends Worker> = Worker &
  PromisifiedObject<Omit<T, keyof Worker>>;

export interface WrappedMethodRequestMessageEvent {
  id: string;
  method: string;
  args?: any[];
}

export type WrappedMethodFulfilledResultMessageEvent<T = unknown> =
  WrappedMethodRequestMessageEvent & PromiseFulfilledResult<T>;

export type WrappedMethodRejectedResultMessageEvent =
  WrappedMethodRequestMessageEvent & PromiseRejectedResult;

export interface SetupWorkerClientOptions<
  T extends Worker,
  U = Omit<T, keyof Worker>,
> {
  timeout?: number;
  getMethodCallId?: (method: keyof U, args: unknown[]) => string;
}
