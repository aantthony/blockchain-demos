const crypto = require('crypto');
const { randomBytes } = require('crypto');
const secp256k1 = require('secp256k1');

module.exports = {
  createPrivateKey() {
    let privKey;
    do {
      privKey = randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privKey));

    return privKey;
  },
  createPublicKey(privKey) {
    const pubKey = secp256k1.publicKeyCreate(privKey);
    return pubKey;
  },
  createSignature(messageHex, privKey) {
    const message = new Buffer(messageHex, 'hex');
    const sigObj = secp256k1.sign(message, privKey);
    return sigObj.signature.toString('hex');
  },
  verifySignature(dataHex, signatureHex, pubKey) {
    const data = new Buffer(dataHex, 'hex');
    const signature = new Buffer(signatureHex, 'hex');
    return secp256k1.verify(data, signature, pubKey)
  },
  sha256(str) {
    return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
  },
}
