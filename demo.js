const createBlockchain = require('./blockchain');

const {
  createPrivateKey,
  createPublicKey,
  createSignature,
} = require('./crypto-primitives');

const chain = createBlockchain();

const privateAlice = createPrivateKey();
const privateBob = createPrivateKey();

const pubAlice = createPublicKey(privateAlice);
const pubBob = createPublicKey(privateBob);

// Create money out of nothing.
// (The first transaction in a block is allowed to create $50).
const coinbaseTx = chain.createTransaction([], [pubAlice], [50]);

chain.applyNextBlock({
  transactions: [coinbaseTx],
});

// Reference to first output on coinbaseTx (we are going to spend it):
const utxo1 = chain.transactionHash(coinbaseTx) + '_0';

// Create a new (unsigned) transaction to spend it:
const tx1 = chain.createTransaction([utxo1], [pubBob], [10]);

// Sign the transaction hash with the UTXO owners private key:
const tx1Hash = chain.transactionHash(tx1);
const tx1Sigs = [createSignature(tx1Hash, privateAlice)];

const isValid = chain.isValidTransaction(tx1, tx1Sigs);

// Assert that the transaction is valid (i.e. inputs >= inputs and sig is valid)
console.log({isValid});
