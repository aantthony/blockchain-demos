const WebSocket = require('rpc-websockets').Client;

module.exports = function createRPCClient(path) {
  // instantiate Client and connect to an RPC server
  let ws = null;

  return {
    async open(host) {
      ws = new WebSocket(host);
      return new Promise((resolve, reject) => {
        ws.on('open', () => {
          resolve();
        });
        ws.on('error', (err) => {
          console.log('err', err);
        });
      });
    },
    close() {
      ws.close();
    },
    async call(method, params) {
      return ws.call(method, params)
      .then(null, errObj => {
        console.log(errObj);
        const err = new Error(`Failed to call method "${method}": ${errObj.message}`);
        err.code = errObj.code;
        throw err;
      });
    },
    on(eventName, handler) {
      ws.on(eventName, () => {
        handler();
      });
    },
  };
};
