const net = require('net');
const url = require('url');
const byline = require('byline');
const configureNAT = require('./nat');
const logger = require('@aantthony/logger')('p2p');

function log(message) {
  logger.info(message);
}

function sendMessage(msg, sockets) {
  if (!sockets) throw new Error('Missing argument: sockets');
  const dat = Buffer.from(JSON.stringify(msg), 'utf8');
  const footer = Buffer.from('\n', 'utf8');
  const combined = Buffer.concat([dat, footer]);
  if (Array.isArray(sockets)) {
    sockets.forEach(socket => {
      try {
        socket.write(combined);
      } catch (ex) {
        log(`A::${ex.stack}`);
      }
    });
  } else {
    if (!sockets.writable) return;
    try {
      sockets.write(combined);
    } catch (ex) {
      log(`${ex.stack}`);
    }
  }
}

function bind(socket, handler) {
  const stream = byline(socket);
  stream.on('data', line => {
    let j;
    try {
      j = JSON.parse(line);
    } catch (ex) {
      log(`Invalid message from ${peerName(socket)}: ${ex.message}`);
    }

    handler(j, socket);
  });
}

function peerName(client) {
  return `node://${client.remoteAddress}:${client.remotePort}/`;
}

module.exports = function createPeer({nodelist, listenPort}) {
  const peerId = require('crypto').pseudoRandomBytes(32).toString('hex');

  let messageHandler = null;
  let peers = [];

  const controlMethods = {
    get_peers(message, sender) {
      sendMessage({control: 'peers', peers: peers.filter(p => p.public).map(p => ({id: p.id, name: peerName(p)}))}, sender);
    },
    register(message, sender) {
      if (message.id === peerId) {
        goodbye(sender);
        return;
      }
      sender.id = message.id;
      sender.public = message.public || false;
      if (peers.indexOf(sender) === -1) {
        peers.push(sender);
        log(`Connected to peer: ${message.id}. Total peers = ${peers.length}`);
      }
    },
    peers(message, sender) {
      message.peers.forEach(peer => {
        if (peer.id !== peerId) {
          connect(peer.name);
        }
      });
    },
  };

  function goodbye(socket) {
    socket.destroy();
  }

  function handle(message, sender) {
    if (message.error) {
      log(`ERROR from ${peerName(sender)}: ${message.error}`)
    } else if (message.control) {
      if (message.control === 'get_peers') return controlMethods.get_peers(message, sender);
      if (message.control === 'register') return controlMethods.register(message, sender);
      if (message.control === 'peers') return controlMethods.peers(message, sender);
      if (message.control === 'ping') {
        return;
      }
      sendMessage({error: `Unknown control method: ${message.control}.`}, sender);
    } else {
      messageHandler(
        message,
        function respond(response) {
          sendMessage(response, sender);
        },
        function relay(response) {
          sendMessage(response, peers.filter(p => p !== sender));
        }
      );
    }
  }

  function broadcast(message) {
    const buf = buildMessage(message);
    peers.forEach(peer => peer.write(buf));
  }

  var server = net.createServer(socket => {
    log(`server accepted connection from ${peerName(socket)}.`);
    sendMessage({control: 'register', id: peerId}, socket);
    bind(socket, handle);
  });

  function connect(address) {
    const parsedAddress = url.parse(address);
    log(`Attempting to connect to peer ${address}...`)
    if (peers.some(p => p.remoteAddress === parsedAddress.hostname && p.remotePort === parsedAddress.port)) return null;
    const client = new net.Socket();

    client.connect(parsedAddress.port, parsedAddress.hostname, () => {
      peers.push(client);
      bind(client, handle);

      sendMessage({control: 'register', id: peerId}, client);
      sendMessage({control: 'get_peers'}, client);
    });
    client.on('error', err => {
      log('Client error: ' + err.message);
    });
    client.on('close', function() {
      const index = peers.indexOf(client);
      peers.splice(index, 1);
      log(`Total peers = ${peers.length}`);
    });
  }

  nodelist.forEach(connect);

  server.on('error', (err) => {
    log(`Could not start server: ${err.code}`);
  });

  if (listenPort) {
    server.listen(listenPort, () => {
      configureNAT(listenPort)
      .then(info => {
        const name = `node://${info.ip}:${listenPort}/`;
        log(`New Node is UP! ${name}`);
        sendMessage({control: 'register', id: peerId, public: true}, peers);
      })
      .then(null, (err) => {
        log(`Failed to setup NAT: ${err.message}`);
      });
    });
  }

  setInterval(() => {
    sendMessage({control: 'ping'}, peers);
  }, 15000);

  return {
    publish(message) {
      sendMessage(message, peers);
    },
    on(eventName, eventHandler) {
      if (eventName === 'message') messageHandler = eventHandler;
    }
  }
};
