const createDiskStorage = require('./src/disk-storage');
const createProofOfWork = require('./src/proof-of-work');
const createPeer = require('./src/p2p');
const transition = require('./src/transition');
const {sha256} = require('./src/primitives');
const Transaction = require('./src/transaction');
const log = require('@aantthony/logger')('full-node.js');

function genesisBlockHeader() {
  return {
    parent: sha256('Genesis').toString('hex'),
    merkleRoot: sha256('').toString('hex'),
    nonce: 0,
  };
}

function createBlockchain() {
  const diskStorage = createDiskStorage(__dirname);
  const consensusModel = createProofOfWork();

  let state = null;
  let currentBlockHeader = null;
  let blockNumber = -1;

  async function deriveStateFromStorage(blockHash) {
    let s = null;
    const {totalBlocks} = await diskStorage.get('index');
    if (maxBlock === undefined) maxBlock = totalBlocks;
    for (let i = 1; i < maxBlock && i < totalBlocks; i++) {
      const data = await diskStorage.readBlockData(i);
      s = transition(s, data);
    }

    state = s;

    if (maxBlock > 0) {
      currentBlockHeader = await diskStorage.readBlockHeader(maxBlock);
      blockNumber = maxBlock;
    } else if (totalBlocks > 0) {
      currentBlockHeader = await diskStorage.readBlockHeader(totalBlocks);
      blockNumber = totalBlocks;
    } else {
      currentBlockHeader = genesisBlockHeader();
      blockNumber = 1;
      // diskStorage.put();
    }
  }

  function handleBlock(blockHeader, blockData) {
    currentBlockHeader = blockHeader;
    blockNumber = blockNumber + 1;
    state = transition(state, blockData);

    diskStorage.writeBlock(blockNumber + 1, blockHeader, blockData);
  }

  return {
    async start() {
      log.info('Starting node...');
      await deriveStateFromStorage();

      const peer = createPeer({
        nodelist: ['node://localhost:9337/'],
        listenPort: 9337,
      });

      peer.on('message', (message, respond, relay) => {
        if (message.type === 'block') {
          const isValid = consensusModel.validateBlockHeader(
            currentBlockHeader,
            blockHeader,
            blockData,
          );
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
