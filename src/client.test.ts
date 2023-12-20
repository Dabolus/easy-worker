import { describe, it, expect, jest, setSystemTime, Mock } from 'bun:test';
import setupWorkerClient from './client.js';
import type {
  WrappedMethodFulfilledResultMessageEvent,
  WrappedMethodRejectedResultMessageEvent,
} from './model.js';

const fakeMethodName = 'fakeMethod';
const getFakeWorker = () =>
  ({
    addEventListener: jest.fn(),
    postMessage: jest.fn(),
  } as unknown as Worker);
interface FakeExtendedWorker extends Worker {
  [fakeMethodName]: () => number;
}

describe('client', () => {
  it('adds a wrapper function for each specified method', () => {
    const fakeWorker = getFakeWorker();
    const augmentedWorker = setupWorkerClient<FakeExtendedWorker>(fakeWorker, [
      fakeMethodName,
    ]);
    expect(fakeWorker.addEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
    expect(augmentedWorker[fakeMethodName]).toBeInstanceOf(Function);
  });

  it('correctly handles fulfilled results', async () => {
    const fakeId = 'fakeId';
    const fakeWorker = getFakeWorker();
    const augmentedWorker = setupWorkerClient<FakeExtendedWorker>(
      fakeWorker,
      [fakeMethodName],
      {
        getMethodCallId: () => fakeId,
      },
    );
    const fakeResult = 123;
    const fakeEvent = {
      data: {
        id: fakeId,
        method: fakeMethodName,
        status: 'fulfilled',
        value: fakeResult,
      } satisfies WrappedMethodFulfilledResultMessageEvent<number>,
    } as unknown as MessageEvent<
      WrappedMethodFulfilledResultMessageEvent<number>
    >;
    const fakeResultPromise = augmentedWorker[fakeMethodName]();
    const eventListenerCallback = (
      fakeWorker.addEventListener as Mock<Worker['addEventListener']>
    ).mock.calls[0][1] as EventListener;
    eventListenerCallback(fakeEvent);
    await expect(fakeResultPromise).resolves.toBe(fakeResult);
  });

  it('correctly handles rejected results', async () => {
    const fakeId = 'fakeId';
    const fakeWorker = getFakeWorker();
    const augmentedWorker = setupWorkerClient<FakeExtendedWorker>(
      fakeWorker,
      [fakeMethodName],
      {
        getMethodCallId: () => fakeId,
      },
    );
    const fakeError = new Error('fakeError');
    const fakeEvent = {
      data: {
        id: fakeId,
        method: fakeMethodName,
        status: 'rejected',
        reason: fakeError,
      } satisfies WrappedMethodRejectedResultMessageEvent,
    } as unknown as MessageEvent<WrappedMethodRejectedResultMessageEvent>;
    const fakeResultPromise = augmentedWorker[fakeMethodName]();
    const eventListenerCallback = (
      fakeWorker.addEventListener as Mock<Worker['addEventListener']>
    ).mock.calls[0][1] as EventListener;
    eventListenerCallback(fakeEvent);
    await expect(fakeResultPromise).rejects.toEqual(fakeError);
  });

  it('correctly handles timeouts', async () => {
    const fakeTime = Date.now();
    setSystemTime(fakeTime);
    const timeout = 10;
    const fakeId = 'fakeId';
    const fakeWorker = getFakeWorker();
    const augmentedWorker = setupWorkerClient<FakeExtendedWorker>(
      fakeWorker,
      [fakeMethodName],
      {
        timeout,
        getMethodCallId: () => fakeId,
      },
    );
    const fakeError = new Error('fakeError');
    // The event is going to be for another random event, so it should be ignored.
    const fakeEvent = {
      data: {
        id: 'anotherFakeId',
        method: fakeMethodName,
        status: 'rejected',
        reason: fakeError,
      } satisfies WrappedMethodRejectedResultMessageEvent,
    } as unknown as MessageEvent<WrappedMethodRejectedResultMessageEvent>;
    const fakeResultPromise = augmentedWorker[fakeMethodName]();
    const eventListenerCallback = (
      fakeWorker.addEventListener as Mock<Worker['addEventListener']>
    ).mock.calls[0][1] as EventListener;
    eventListenerCallback(fakeEvent);
    setSystemTime(fakeTime + timeout + 1);
    await expect(fakeResultPromise).rejects.toEqual(fakeError);
    setSystemTime();
  });
});
