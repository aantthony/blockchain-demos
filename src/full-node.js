module.exports = function createBlockchain(communciationModel, stateModel, consensusModel) {
  let state = stateModel.genesis();
  let currentBlockHeader = {};

  return {
    handleBlock(blockHeader, blockData) {
      if (!consensusModel.validateBlockHeader(blockHeader)) {
        return;
      }
    },
  };
};
