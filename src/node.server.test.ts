import { describe, it, expect, jest, Mock } from 'bun:test';
import type { MessagePort } from 'node:worker_threads';
import type {
  WrappedMethodFulfilledResultMessageEvent,
  WrappedMethodRejectedResultMessageEvent,
  WrappedMethodRequestMessageEvent,
} from './model.js';
import setupWorkerServer from './server.js';
import nodeAdapter from './adapters/node.js';

const fakeMethodName = 'fakeMethod';
const getFakeTarget = () =>
  ({
    on: jest.fn(),
    postMessage: jest.fn(),
  } as unknown as MessagePort);

describe('node', () => {
  describe('server', () => {
    it('calls the correct function and emits the correct result based on received event', async () => {
      const fakeTarget = nodeAdapter(getFakeTarget());
      const fakeArgs = [1, 2, 3];
      const fakeResult = 123;
      const fakeMethod = jest.fn(() => fakeResult);
      setupWorkerServer(
        {
          [fakeMethodName]: fakeMethod,
        },
        { target: fakeTarget },
      );
      expect(fakeTarget.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      const fakeId = 'fakeId';
      const fakeEvent: WrappedMethodRequestMessageEvent = {
        id: fakeId,
        method: fakeMethodName,
        args: fakeArgs,
      };
      const eventListenerCallback = (
        fakeTarget.on as unknown as Mock<MessagePort['on']>
      ).mock.calls[0][1];
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
      const fakeTarget = nodeAdapter(getFakeTarget());
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
      expect(fakeTarget.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      const fakeId = 'fakeId';
      const fakeEvent: WrappedMethodRequestMessageEvent = {
        id: fakeId,
        method: fakeMethodName,
        args: fakeArgs,
      };
      const eventListenerCallback = (
        fakeTarget.on as unknown as Mock<MessagePort['on']>
      ).mock.calls[0][1];
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
      const fakeTarget = nodeAdapter(getFakeTarget());
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
      expect(fakeTarget.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      const fakeId = 'fakeId';
      const fakeEvent: WrappedMethodRequestMessageEvent = {
        id: fakeId,
        method: fakeMethodName,
        args: fakeArgs,
      };
      const eventListenerCallback = (
        fakeTarget.on as unknown as Mock<MessagePort['on']>
      ).mock.calls[0][1];
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
      const fakeTarget = nodeAdapter(getFakeTarget());
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
      expect(fakeTarget.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );
      const fakeId = 'fakeId';
      const fakeEvent: WrappedMethodRequestMessageEvent = {
        id: fakeId,
        method: fakeMethodName,
        args: fakeArgs,
      };
      const eventListenerCallback = (
        fakeTarget.on as unknown as Mock<MessagePort['on']>
      ).mock.calls[0][1];
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
});
