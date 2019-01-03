const {sha256} = require('./primitives');

function blockHash({parent, merkleRoot, nonce}) {
  return sha256(`${parent}|${merkleRoot}|${nonce}`);
}

function isValidBlockHash(blockHash, difficulty) {
  const zerosRequired = Math.floor(difficulty / 1000);
  return blockHash.indexOf(/[^0]/) >= zerosRequired;
}

module.exports = function createConsensusModel() {
  return {
    validateBlockHeader(previousBlockHeader, blockHeader, merkleTree, transactions) {
      const blockHash = blockHash({parent, merkleRoot, nonce});
      return isValidBlockHash(blockHash, previousBlockHeader.difficulty));
    },
    mintHeader(previousBlockHeader, blockData, nonce) {
      const merkleRoot = sha256(blockData);
      const parent = blockHash(previousBlockHeader);
      const hash = blockHash({ parent, merkleRoot, nonce });
      return {
        parent,
        merkleRoot,
        nonce,
        difficulty: previousBlockHeader.difficulty + 1,
      };
    },
  }
}
