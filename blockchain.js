const {sha256, verifySignature} = require('./crypto-primitives');

function createTransaction(inputs, outputPubKeys, outputAmounts) {
  return {
    inputs: inputs,
    outputs: outputPubKeys.map((pub, i) => {
      return {
        pub: pub,
        amount: outputAmounts[i],
      };
    }),
  };
}

function transactionHash(tx) {
  return sha256(
    [
      tx.inputs.join(','),
      tx.outputs.map(s => {
        return `${s.pub}+${s.amount}`;
      }).join(','),
    ].join(':')
  );
}

function isValidTransaction(state, tx, sigs) {
  let sumInputs = 0;
  let sumOutputs = 0;
  for (let i = 0; i < tx.outputs.length; i++) {
    sumOutputs += tx.outputs[i].amount;
  }
  const txHash = transactionHash(tx);
  for (let i = 0; i < tx.inputs.length; i++) {
    const utxoId = tx.inputs[i];
    const utxo = state.utxos[utxoId];
    if (!utxo) return false;
    const matchesSig = verifySignature(txHash, sigs[i], utxo.pub);
    if (!matchesSig) return false;
    sumInputs += utxo.amount;
  }
  return sumInputs >= sumOutputs;
}

function reduce(state, blockdata) {
  blockdata.transactions.forEach(tx => {
    tx.inputs.forEach(input => {
      delete state.utxos[input];
    });
    const txId = transactionHash(tx);
    tx.outputs.forEach((output, i) => {
      const newUtxoId = `${txId}_${i}`;
      state.utxos[newUtxoId] = output;
    });
  });
  return state;
}

module.exports = function createBlockchain() {
  let state = {
    utxos: {},
  };

  return {
    transactionHash(tx) {
      return transactionHash(tx);
    },
    createTransaction(inputs, outputPubKeys, outputAmounts) {
      return createTransaction(inputs, outputPubKeys, outputAmounts);
    },
    isValidTransaction(tx, sigs) {
      return isValidTransaction(state, tx, sigs);
    },
    applyNextBlock(blockdata) {
      state = reduce(state, blockdata);
    },
  };
}
