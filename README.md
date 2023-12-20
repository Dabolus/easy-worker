# easy-worker

A tiny library that simplifies calling functions in a worker by handling events
and turning them into promises.
It works very similarly to [comlink](https://github.com/GoogleChromeLabs/comlink),
but it's much smaller and simpler.

If you don't need control over the worker, you might also consider the
following alternatives:

- [greenlet](https://github.com/developit/greenlet): if you need to move only a single function to a worker;
- [workerize](https://github.com/developit/workerize): if you need to move a whole module to a worker.

## Installation

```sh
npm i @easy-worker/core
# or
yarn add @easy-worker/core
# or
bun i @easy-worker/core
```
