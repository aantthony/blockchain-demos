const {
  sha256,
  verifySignature,
  createPrivateKey,
  createPublicKey,
  createSignature,
} = require('./primitives');

module.exports = class Transaction {
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
  verify(state, sigs) {
    const tx = this;
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
  }
}
