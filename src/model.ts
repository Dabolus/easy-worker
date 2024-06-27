export type KeyVal = Record<string, any>;

export type Fn = (...args: any[]) => any;

export type Ctor = new (...args: any[]) => any;

export type PromisifiedObject<T extends {}> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : T[K];
};

export type MessageEventPayload = { data: any };

export type MessageEventListenerFn = (event: MessageEventPayload) => void;

export type MessageEventListenerObject = {
  handleEvent: MessageEventListenerFn;
};

export type MessageEventListener =
  | MessageEventListenerFn
  | MessageEventListenerObject;

export interface WorkerInterface {
  addEventListener(type: 'message', listener: MessageEventListener): void;
  postMessage(message: any): void;
}

export type PromisifiedWorker<T extends KeyVal, U extends WorkerInterface> = U &
  PromisifiedObject<T>;

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
  V extends WorkerInterface = WorkerInterface,
> {
  target?: V;
}
