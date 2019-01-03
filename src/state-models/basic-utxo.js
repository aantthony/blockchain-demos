const {
  sha256,
  verifySignature,
  createPrivateKey,
  createPublicKey,
  createSignature,
} = require('../primitives');

class Transaction {
  constructor(inputs, outputPubKeys, outputAmounts) {
    this.inputs = inputs;
    this.outputs = outputPubKeys.map((pub, i) => {
      return { pub: pub, amount: outputAmounts[i] };
    });
  }
  serialize() {
    return new Buffer(
      [
        this.inputs.join(','),
        this.outputs.map(s => {
          return `${s.pub}+${s.amount}`;
        }).join(','),
      ].join(':')
    )
  }
  hash() {
    return sha256(this.serialize());
  }
  outputAt(index) {
    return `${this.hash().toString('hex')}_${index}`;
  }
  sign(privateKey) {
    return createSignature(this.hash(), privateKey);
  }
}

module.exports = {
  Transaction,

  createPrivateKey,
  createPublicKey,
  genesis() {
    return {utxos: {}};
  },
  transition(state, blockdata) {
    blockdata.transactions.forEach(tx => {
      tx.inputs.forEach(input => {
        delete state.utxos[input];
      });
      const txId = tx.hash();
      tx.outputs.forEach((output, i) => {
        const newUtxoId = tx.outputAt(i);
        state.utxos[newUtxoId] = output;
      });
    });
    return state;
  },
  isValidTransaction(state, tx, sigs) {
    let sumInputs = 0;
    let sumOutputs = 0;
    for (let i = 0; i < tx.outputs.length; i++) {
      sumOutputs += tx.outputs[i].amount;
    }
    const txHash = tx.hash();
    for (let i = 0; i < tx.inputs.length; i++) {
      const utxoId = tx.inputs[i];
      const utxo = state.utxos[utxoId];
      if (!utxo) return false;
      const matchesSig = verifySignature(txHash, sigs[i], utxo.pub);
      if (!matchesSig) return false;
      sumInputs += utxo.amount;
    }
    return sumInputs >= sumOutputs;
  },
};
