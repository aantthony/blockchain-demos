module.exports = {
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
};
