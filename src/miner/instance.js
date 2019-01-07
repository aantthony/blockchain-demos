const microtime = require('microtime');
const {sha256} = require('../common/primitives');
const createRPCClient = require('../common/rpc-client');
const createProofOfWork = require('../common/proof-of-work');
const Transaction = require('../common/transaction');
const log = require('@aantthony/logger')('miner');

module.exports = function createMiner(rpcServerAddress, rewardAddressHex) {
  const rpc = createRPCClient(rpcServerAddress);
  const consensus = createProofOfWork();
  const rewardAddress = Buffer.from(rewardAddressHex, 'hex');

  return {
    async start() {
      log.info('Connecting to RPC...');
      await rpc.open(rpcServerAddress);
      log.info('Getting latest block...');
      while (1) {
        const {header} = await rpc.call('get_latest_block');

        log.info('Building coinbase transaction...');
        const totalReward = 50;
        const coinbase = new Transaction([header.height], [rewardAddress], [totalReward]);
        const data = {
          transactions: [
            coinbase.toJSON(),
          ],
        };
        log.info('Generating block...');
        const newBlockHeader = consensus.build(header, data);

        log.info('Finding nonce...');

        let lastAt = microtime.nowDouble();
        let lastNonce = newBlockHeader.nonce;
        let nCheckpoint = 5;

        while (1) {
          // TODO: refresh on 'block' event from RPC
          if (newBlockHeader.nonce % nCheckpoint === 0) {
            let tNow = microtime.nowDouble();
            const duration = tNow - lastAt;

            if (duration < 10) {
              nCheckpoint *= 2;
            }

            const count = newBlockHeader.nonce - lastNonce;
            const rate = Math.round(count / duration);
            lastAt = tNow;
            lastNonce = newBlockHeader.nonce;
            log.info(`Mining: Hashrate = ${(rate/1e6).toFixed(2)} MH/sec`);
          }

          newBlockHeader.nonce++;
          const isValid = consensus.validateBlockHash(header, newBlockHeader);

          if (isValid) {
            log.info('Submitting block...');
            const response = await rpc.call('block', {header: newBlockHeader, data});
            log.info(`Response: ${JSON.stringify(response)}`);
            break;
          }
        }
      }
    }
  }
};
