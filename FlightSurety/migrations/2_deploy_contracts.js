const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer) {

    let firstAirline = '0x41774bef90dc705f6c44330cf53124172ea37deb';
    let owner = '0x98220bf443b0c5e9c1309988b8a723aadd124b3a';
    deployer.deploy(FlightSuretyData, {from: firstAirline})
    .then(() => {
        return deployer.deploy(FlightSuretyApp, FlightSuretyData.address, {from: owner})
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:8545',
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address
                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                });
    });
}