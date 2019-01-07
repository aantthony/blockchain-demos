const WebSocketServer = require('rpc-websockets').Server

module.exports = function createRPCServer(methods) {
  const server = new WebSocketServer({
    port: 8080,
    host: 'localhost'
  });

  Object.keys(methods)
  .forEach(method => {
    server.register(method, methods[method]);
  });
  return {
    emit(eventName) {
      server.emit(eventName);
    },
  }
};
