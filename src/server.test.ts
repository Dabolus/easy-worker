import { describe, it, expect, jest, Mock } from 'bun:test';
import type {
  WrappedMethodFulfilledResultMessageEvent,
  WrappedMethodRejectedResultMessageEvent,
  WrappedMethodRequestMessageEvent,
} from './model.js';
import setupWorkerServer from './server.js';

const fakeMethodName = 'fakeMethod';
const getFakeTarget = () =>
  ({
    addEventListener: jest.fn(),
    postMessage: jest.fn(),
  } as unknown as typeof globalThis);

describe('server', () => {
  it('calls the correct function and emits the correct result based on received event', async () => {
    const fakeTarget = getFakeTarget();
    const fakeArgs = [1, 2, 3];
    const fakeResult = 123;
    const fakeMethod = jest.fn(() => fakeResult);
    setupWorkerServer(
      {
        [fakeMethodName]: fakeMethod,
      },
      { target: fakeTarget },
    );
    expect(fakeTarget.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
    const fakeId = 'fakeId';
    const fakeEvent = {
      data: {
        id: fakeId,
        method: fakeMethodName,
        args: fakeArgs,
      } satisfies WrappedMethodRequestMessageEvent,
    } as unknown as MessageEvent<WrappedMethodRequestMessageEvent>;
    const eventListenerCallback = (
      fakeTarget.addEventListener as Mock<
        (typeof globalThis)['addEventListener']
      >
    ).mock.calls[0][1] as EventListener;
    eventListenerCallback(fakeEvent);
    expect(fakeMethod).toHaveBeenCalledWith(...fakeArgs);
    // Wait next cycle for the event to be emitted
    await new Promise(resolve => setImmediate(resolve));
    expect(fakeTarget.postMessage).toHaveBeenCalledWith({
      id: fakeId,
      method: fakeMethodName,
      args: fakeArgs,
      status: 'fulfilled',
      value: fakeResult,
    } satisfies WrappedMethodFulfilledResultMessageEvent<number>);
  });

  it('emits the correct error if the function fails', async () => {
    const fakeTarget = getFakeTarget();
    const fakeArgs = [1, 2, 3];
    const fakeError = new Error('fakeError');
    const fakeMethod = jest.fn(() => {
      throw fakeError;
    });
    setupWorkerServer(
      {
        [fakeMethodName]: fakeMethod,
      },
      { target: fakeTarget },
    );
    expect(fakeTarget.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
    const fakeId = 'fakeId';
    const fakeEvent = {
      data: {
        id: fakeId,
        method: fakeMethodName,
        args: fakeArgs,
      } satisfies WrappedMethodRequestMessageEvent,
    } as unknown as MessageEvent<WrappedMethodRequestMessageEvent>;
    const eventListenerCallback = (
      fakeTarget.addEventListener as Mock<
        (typeof globalThis)['addEventListener']
      >
    ).mock.calls[0][1] as EventListener;
    eventListenerCallback(fakeEvent);
    expect(fakeMethod).toHaveBeenCalledWith(...fakeArgs);
    // Wait next cycle for the event to be emitted
    await new Promise(resolve => setImmediate(resolve));
    expect(fakeTarget.postMessage).toHaveBeenCalledWith({
      id: fakeId,
      method: fakeMethodName,
      args: fakeArgs,
      status: 'rejected',
      reason: {
        name: fakeError.name,
        message: fakeError.message,
        stack: fakeError.stack,
      },
    } satisfies WrappedMethodRejectedResultMessageEvent);
  });

  it('works with classes', async () => {
    const fakeTarget = getFakeTarget();
    const fakeArgs = [1, 2, 3];
    const fakeResult = 123;
    const fakeMethod = jest.fn((..._args: number[]) => fakeResult);
    class FakeClass {
      [fakeMethodName](...args: number[]) {
        return fakeMethod(...args);
      }
    }
    setupWorkerServer(FakeClass, {
      target: fakeTarget,
    });
    expect(fakeTarget.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
    const fakeId = 'fakeId';
    const fakeEvent = {
      data: {
        id: fakeId,
        method: fakeMethodName,
        args: fakeArgs,
      } satisfies WrappedMethodRequestMessageEvent,
    } as unknown as MessageEvent<WrappedMethodRequestMessageEvent>;
    const eventListenerCallback = (
      fakeTarget.addEventListener as Mock<
        (typeof globalThis)['addEventListener']
      >
    ).mock.calls[0][1] as EventListener;
    eventListenerCallback(fakeEvent);
    expect(fakeMethod).toHaveBeenCalledWith(...fakeArgs);
    // Wait next cycle for the event to be emitted
    await new Promise(resolve => setImmediate(resolve));
    expect(fakeTarget.postMessage).toHaveBeenCalledWith({
      id: fakeId,
      method: fakeMethodName,
      args: fakeArgs,
      status: 'fulfilled',
      value: fakeResult,
    } satisfies WrappedMethodFulfilledResultMessageEvent<number>);
  });

  it('works with instances of classes', async () => {
    const fakeTarget = getFakeTarget();
    const fakeArgs = [1, 2, 3];
    const fakeResult = 123;
    const fakeMethod = jest.fn((...args: number[]) => fakeResult);
    class FakeClass {
      [fakeMethodName](...args: number[]) {
        return fakeMethod(...args);
      }
    }
    setupWorkerServer(new FakeClass(), {
      target: fakeTarget,
    });
    expect(fakeTarget.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
    const fakeId = 'fakeId';
    const fakeEvent = {
      data: {
        id: fakeId,
        method: fakeMethodName,
        args: fakeArgs,
      } satisfies WrappedMethodRequestMessageEvent,
    } as unknown as MessageEvent<WrappedMethodRequestMessageEvent>;
    const eventListenerCallback = (
      fakeTarget.addEventListener as Mock<
        (typeof globalThis)['addEventListener']
      >
    ).mock.calls[0][1] as EventListener;
    eventListenerCallback(fakeEvent);
    expect(fakeMethod).toHaveBeenCalledWith(...fakeArgs);
    // Wait next cycle for the event to be emitted
    await new Promise(resolve => setImmediate(resolve));
    expect(fakeTarget.postMessage).toHaveBeenCalledWith({
      id: fakeId,
      method: fakeMethodName,
      args: fakeArgs,
      status: 'fulfilled',
      value: fakeResult,
    } satisfies WrappedMethodFulfilledResultMessageEvent<number>);
  });
});
