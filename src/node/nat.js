const gateway = require('default-gateway');
const natPMP = require('nat-pmp');
const natUPNP = require('nat-upnp');

module.exports = async function setup(portNumber, protocol = 'tcp') {
  const upnpClient = natUPNP.createClient();
  const currentGateway = (await gateway.v4()).gateway || (await gateway.v6()).gateway;
  const pmpClient = natPMP.connect(currentGateway);

  pmpClient.portMapping({
    private: portNumber,
    public: portNumber,
    description: 'blockchain-demo',
    type: protocol,
    ttl: 3600,
  }, function (err, info) {
    // if (err) throw err;
  });

  upnpClient.portMapping({
    private: portNumber,
    public: portNumber,
    description: 'blockchain-demo',
    type: protocol,
    ttl: 0,
  });

  return new Promise((resolve, reject) => {
    pmpClient.externalIp(function (err, info) {
      if (err) return reject(err);
      const ip = info.ip.join('.');
      resolve({ip});
    });
  });
};
