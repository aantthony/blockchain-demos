const {sha256} = require('../common/primitives');

function hashBlock({parent, merkleRoot, difficulty, nonce}) {
  return sha256(`${parent}|${merkleRoot}|${nonce}`);
}

function isValidBlockHash(hash, difficulty) {
  const zerosRequired = Math.floor(2 + difficulty / 0x100);
  const firstByteMax = 0x100 - (difficulty % 0x100);
  let i;
  for (i = 0; i < zerosRequired; i++ ) {
    if (hash[i] !== 0) return false;
  }
  return hash[i] < firstByteMax;
}

module.exports = function createConsensusModel() {
  return {
    genesis() {
      return {
        header: {
          height: 1,
          parent: Buffer.alloc(32).fill(0).toString('hex'),
          merkleRoot: sha256('').toString('hex'),
          difficulty: 1,
          nonce: 0,
        },
        data: {
          transactions: [],
        },
      };
    },
    validateBlockHash(previousBlockHeader, blockHeader) {
      const hash = hashBlock(blockHeader);
      return isValidBlockHash(hash, previousBlockHeader.difficulty);
    },
    hash(blockHeader) {
      return hashBlock(blockHeader).toString('hex');
    },
    build(previousBlockHeader, data) {
      const newBlockHeader = {
        height: previousBlockHeader.height + 1,
        parent: hashBlock(previousBlockHeader).toString('hex'),
        merkleRoot: sha256(JSON.stringify(data)).toString('hex'),
        difficulty: previousBlockHeader.difficulty + 1,
        nonce: 0,
      };
      return newBlockHeader;
    },
    validateBlockData(blockHeader, blockData, utxoValidator) {
      const derivedMerkleRoot = sha256(JSON.stringify(blockData)).toString('hex');
      return derivedMerkleRoot === blockHeader.merkleRoot;
    },
  }
}
