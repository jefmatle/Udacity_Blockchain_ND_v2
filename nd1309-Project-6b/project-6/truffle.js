const HDWalletProvider = require("truffle-hdwallet-provider");
const mnemonic = "MetaMask mnemonic";
const accessToken = "INFURA API Key";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          mnemonic,
          accessToken
        );
      },
      network_id: 3,
      gas: 500000
    }
  }
};