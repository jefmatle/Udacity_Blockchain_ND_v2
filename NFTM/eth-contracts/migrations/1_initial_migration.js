// var Migrations = artifacts.require("./Migrations.sol");
var Migrations = artifacts.require("../contracts/Migrations.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
