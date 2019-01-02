const {sha256} = require('./crypto-primitives');

function blockHash({merkleRootHash, previousBlockHash, nonce}) {
  return sha256(`${merkleRootHash}|${previousBlockHash}|${nonce}`);
}

function isValidBlockHash(blockHash, difficulty) {
  const zerosRequired = Math.floor(difficulty / 1000);
  return blockHash.indexOf(/[^0]/) >= zerosRequired;
}

module.exports = function createFullNode() {
  let previousBlock = {
    difficulty: 0,
  };

  return {
    validateBlock(blockHeader, merkleTree, transactions) {
      const blockHash = blockHash({merkleRootHash, previousBlockHash, nonce});
      if (!isValidBlockHash(blockHash, previousBlock.difficulty)) {
        return false;
      }
    },
  }
}
