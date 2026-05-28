// Stub for optional wagmi connector peer dependencies that are not installed.
// (@metamask/sdk, porto, @walletconnect/ethereum-provider)
//
// IMPORTANT: .then / .catch / .finally must return `undefined`.
// If a Proxy exposes a .then property, JavaScript treats it as a thenable and
// `await stub` will hang forever trying to resolve the infinite chain.
'use strict';

const THENABLE_KEYS = new Set(['then', 'catch', 'finally']);

function makeStub() {
  return new Proxy(function () {}, {
    get(_t, key) {
      if (THENABLE_KEYS.has(key)) return undefined; // not a Promise
      if (key === Symbol.toPrimitive || key === 'valueOf') return () => 0;
      if (key === 'toString') return () => '[Stub]';
      return makeStub();
    },
    apply() { return makeStub(); },
    construct() { return makeStub(); },
  });
}

const stub = makeStub();
module.exports = stub;
module.exports.default = stub;
module.exports.__esModule = true;
