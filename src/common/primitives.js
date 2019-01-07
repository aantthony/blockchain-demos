const crypto = require('crypto');
const { randomBytes } = require('crypto');
const secp256k1 = require('secp256k1');

module.exports = {
  /**
   * Randomly generate a private key.
   * @return {Buffer<PrivateKey>}
   */
  createPrivateKey() {
    let privKey;
    do {
      privKey = randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privKey));

    return privKey;
  },
  /**
   * Generate a new public key based on a private key. May or may not be random.
   * @param  {Buffer<PrivateKey>} privKey
   * @return {Buffer<PublicKey>}
   */
  createPublicKey(privKey) {
    const pubKey = secp256k1.publicKeyCreate(privKey);
    return pubKey;
  },
  /**
   * Sign a message.
   * @param  {Buffer} message
   * @param  {Buffer<PrivateKey>} privKey
   * @return {Buffer<Signature>}
   */
  createSignature(message, privKey) {
    const sigObj = secp256k1.sign(message, privKey);
    return sigObj.signature;
  },
  /**
   * Verify a signature
   * @param  {Buffer} message
   * @param  {Buffer<Signature>} signature
   * @param  {Buffer<PublicKey>} pubKey
   * @return {Boolean} isValid
   */
  verifySignature(message, signature, pubKey) {
    return secp256k1.verify(message, signature, pubKey);
  },
  /**
   * Collision resistant hash function.
   * @param  {Buffer} buffer
   * @return {Buffer}
   */
  sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
  },
}
