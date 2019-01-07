const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const createMiner = require('./instance');

const miner = createMiner('ws://localhost:8080', '037c861dd6b6533c437f9c0cf02fdd07762ca4c237d2f7f0267e0bd8c8bb395c67');
miner.start();
//
// if (cluster.isMaster) {
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }
//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`);
//   });
// } else {
//   miner.start();
// }
