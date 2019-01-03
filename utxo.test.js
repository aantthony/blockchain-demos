const {
  Transaction,
  createPrivateKey,
  createPublicKey,
  transition,
  genesis,
  isValidTransaction,
} = require('./src/state-models/basic-utxo');

const privateAlice = createPrivateKey();
const privateBob = createPrivateKey();

const pubAlice = createPublicKey(privateAlice);
const pubBob = createPublicKey(privateBob);

let state = genesis();

// Create money out of nothing.
// (The first transaction in a block is allowed to create $50).
const coinbaseTx = new Transaction([], [pubAlice], [50]);

state = transition(state, {
  transactions: [coinbaseTx],
});

// Reference to first output on coinbaseTx (we are going to spend it):
const utxo1 = coinbaseTx.outputAt(0);

// Create a new (unsigned) transaction to spend it:
const tx1 = new Transaction([utxo1], [pubBob], [10]);

// Sign the transaction hash with the UTXO owners private key:
const tx1Sigs = [tx1.sign(privateAlice)];

// Assert that the transaction is valid (i.e. inputs >= inputs and sig is valid)
const isValid = isValidTransaction(state, tx1, tx1Sigs);
console.log({isValid});
