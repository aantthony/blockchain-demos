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
          return `${s.pub.toString('hex')}+${s.amount.toString()}`;
        }).join(','),
      ].join(':')
    )
  }
  static from(json) {
    return new Transaction(
      json.inputs.map(String),
      json.outputs.map(o => Buffer.from(o.pub, 'hex')),
      json.outputs.map(o => parseInt(o.amount)),
    );
  }
  toJSON(sigs) {
    return {
      inputs: this.inputs.map(input => input),
      outputs: this.outputs.map(output => {
        return {pub: output.pub.toString('hex'), amount: output.amount.toFixed(0)};
      }),
      sigs: sigs && sigs.map(s => s.toString('base64')),
    };
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
