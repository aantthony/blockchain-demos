const {sha256} = require('../common/primitives');
const Transaction = require('../common/transaction');
const createProofOfWork = require('../common/proof-of-work');
const createRPCServer = require('../common/rpc-server');

const createDiskStorage = require('./disk-storage');
const createPeer = require('./p2p');
const transition = require('./transition');
const log = require('@aantthony/logger')('full-node.js');

function createBlockHeaderManager() {
  let allBlocks = {};
  let head = {height: -1};
  return {
    add(hash, blockHeader) {
      allBlocks[hash] = blockHeader;
      if (blockHeader.height > head.height) head = blockHeader;
    },
    get(hash) { return allBlocks[hash]; },
    head() { return head; },
    all() {return allBlocks; },
  };
}

function createBlockchain() {
  const disk = createDiskStorage(__dirname);
  const blocks = createBlockHeaderManager();
  const consensus = createProofOfWork();
  const mempool = {}; // txHash => Transaction

  async function handleBlock({header, data}) {
    const parent = blocks.get(header.parent);
    if (!parent) return false;

    if (parent.height !== header.height - 1) throw new Error(`Height claim: [height=${header.height}] is invalid.`);
    const hash = consensus.hash(header);
    if (!consensus.validateBlockHash(parent, header)) throw new Error(`Nonce is invalid.`);
    if (!consensus.validateBlockData(header, data), utxo => null) throw new Error(`Data is invalid.`);

    blocks.add(hash, header);

    await disk.put(header.merkleRoot, data);
    await disk.put('blocks', blocks.all());

    log.info(`Block ${header.height} was accepted. [${hash}]`);

    return true;
  }

  async function load() {
    const stored = await disk.get('blocks');
    if (stored) {
      Object.keys(stored).forEach(hash => blocks.add(hash, stored[hash]));
    } else {
      const genesis = consensus.genesis();
      blocks.add(consensus.hash(genesis.header), genesis.header);
    }
  }

  return {
    async start() {
      log.info('Starting node...');
      await load();

      log.info(`Block height = ${blocks.head().height}`)

      const peer = createPeer({
        nodelist: ['node://localhost:9337/'],
        listenPort: 9337,
      });

      const rpc = await createRPCServer({
        publish_transaction() {

        },
        get_latest_block() {
          return {
            header: blocks.head(),
            data: {transactions: []},
          };
        },
        async block({header, data}) {
          const isValid = await handleBlock({header, data});
          if (!isValid) return false;
          peer.publish({type: 'block', header, data});
          rpc.emit('block');
          return { valid: true };
        },
      });

      peer.on('message', async (message, respond, relay) => {
        log.info(`Got message from peer: ${JSON.stringify(message)}`)
        if (message.type === 'block') {
          const isValid = await handleBlock(message);
          if (!isValid) return false;
          rpc.emit('block');
        }
      });
    }
  };
};

const chain = createBlockchain();

chain.start()
.then(null, err => {
  setImmediate(() => { throw err; });
});
