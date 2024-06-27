import { describe, it, expect, jest, setSystemTime, Mock } from 'bun:test';
import type { Worker } from 'node:worker_threads';
import setupWorkerClient from './client.js';
import type {
  WrappedMethodFulfilledResultMessageEvent,
  WrappedMethodRejectedResultMessageEvent,
} from './model.js';
import nodeAdapter from './adapters/node.js';

const fakeMethodName = 'fakeMethod';
const getFakeWorker = () =>
  ({
    on: jest.fn(),
    postMessage: jest.fn(),
  } as unknown as Worker);

interface FakeExtendedWorker {
  [fakeMethodName]: () => number;
}

describe('node', () => {
  describe('client', () => {
    it('adds a wrapper function for each specified method', () => {
      const fakeWorker = nodeAdapter(getFakeWorker());
      const augmentedWorker = setupWorkerClient<FakeExtendedWorker>(fakeWorker);
      expect(fakeWorker.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      expect(augmentedWorker[fakeMethodName]).toBeInstanceOf(Function);
    });

    it('correctly handles fulfilled results', async () => {
      const fakeId = 'fakeId';
      const fakeWorker = nodeAdapter(getFakeWorker());
      const augmentedWorker = setupWorkerClient<FakeExtendedWorker>(
        fakeWorker,
        {
          getMethodCallId: () => fakeId,
        },
      );
      const fakeResult = 123;
      const fakeEvent: WrappedMethodFulfilledResultMessageEvent<number> = {
        id: fakeId,
        method: fakeMethodName,
        status: 'fulfilled',
        value: fakeResult,
      };
      const fakeResultPromise = augmentedWorker[fakeMethodName]();
      const eventListenerCallback = (
        fakeWorker.on as unknown as Mock<Worker['on']>
      ).mock.calls[0][1];
      eventListenerCallback(fakeEvent);
      await expect(fakeResultPromise).resolves.toBe(fakeResult);
    });

    it('correctly handles rejected results', async () => {
      setSystemTime();
      const fakeId = 'fakeId';
      const fakeWorker = nodeAdapter(getFakeWorker());
      const augmentedWorker = setupWorkerClient<FakeExtendedWorker>(
        fakeWorker,
        {
          getMethodCallId: () => fakeId,
        },
      );
      const fakeError = new Error('fakeError');
      const fakeEvent: WrappedMethodRejectedResultMessageEvent = {
        id: fakeId,
        method: fakeMethodName,
        status: 'rejected',
        reason: fakeError,
      };
      const fakeResultPromise = augmentedWorker[fakeMethodName]();
      const eventListenerCallback = (
        fakeWorker.on as unknown as Mock<Worker['on']>
      ).mock.calls[0][1];
      eventListenerCallback(fakeEvent);
      await expect(fakeResultPromise).rejects.toThrowError(fakeError.name);
    });

    it('correctly handles timeouts', async () => {
      const fakeTime = Date.now();
      setSystemTime(fakeTime);
      const timeout = 10;
      const fakeId = 'fakeId';
      const fakeWorker = nodeAdapter(getFakeWorker());
      const augmentedWorker = setupWorkerClient<FakeExtendedWorker>(
        fakeWorker,
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
        fakeWorker.on as unknown as Mock<Worker['on']>
      ).mock.calls[0][1];
      eventListenerCallback(fakeEvent);
      setSystemTime(fakeTime + timeout + 1);
      await expect(fakeResultPromise).rejects.toThrowError('Timeout');
      setSystemTime();
    });
  });
});
