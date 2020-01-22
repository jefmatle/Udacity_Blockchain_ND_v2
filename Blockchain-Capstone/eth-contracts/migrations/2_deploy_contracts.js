// migrating the appropriate contracts
// var SquareVerifier = artifacts.require("./SquareVerifier.sol");
// var SolnSquareVerifier = artifacts.require("./SolnSquareVerifier.sol");

const ERC721Mintable = artifacts.require('ERC721Mintable');
var Verifier = artifacts.require("../../zokrates/code/square/Verifier.sol");
var SolnSquareVerifier = artifacts.require("../contracts/SolnSquareVerifier");
const fs = require('fs');

module.exports = function(deployer) {
  // deployer.deploy(SquareVerifier);
  // deployer.deploy(SolnSquareVerifier);
  let propertyName = "Udacity Properties";
  let propertySymbol = "*";
  let propertyBaseURI = "https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/";
  deployer.deploy(ERC721Mintable, propertyName, propertySymbol, propertyBaseURI);
  deployer.deploy(Verifier).then(() => {
      return deployer.deploy(SolnSquareVerifier, Verifier.address, propertyName, propertySymbol, propertyBaseURI).then(() => {
          let config = {
              localhost: {
                  url: 'http://localhost:7545',
                  Verifier: Verifier.address,
                  SolnSquareVerifier: SolnSquareVerifier.address
              }
          };
          fs.writeFileSync(__dirname + '/../config.json', JSON.stringify(config, null, '\t'), 'utf-8');
      });
  });
};
