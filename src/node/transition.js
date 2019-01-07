const Transaction = require('../common/transaction');

function genesis() {
  return {utxos: {}};
}

module.exports = function transition(state, blockdata) {
  state = state || genesis();
  blockdata.transactions.forEach(txObj => {
    const tx = Transaction.from(txObj);
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
};
