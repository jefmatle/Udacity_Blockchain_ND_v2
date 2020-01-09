var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    /*
    let testAddresses = [
        "0x69e1CB5cFcA8A311586e3406ed0301C06fb839a2",
        "0xF014343BDFFbED8660A9d8721deC985126f189F3",
        "0x0E79EDbD6A727CfeE09A2b1d0A59F7752d5bf7C9",
        "0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4",
        "0xa23eAEf02F9E0338EEcDa8Fdd0A73aDD781b2A86",
        "0x6b85cc8f612d5457d49775439335f83e12b8cfde",
        "0xcbd22ff1ded1423fbc24a7af2148745878800024",
        "0xc257274276a4e539741ca11b590b9447b26a8051",
        "0x2f2899d6d35b1a48a4fbdc93a37a72f264a9fca7"
    ];
    */

    let testAddresses = [
    "0x98220bf443b0c5e9c1309988b8a723aadd124b3a",
    "0x41774bef90dc705f6c44330cf53124172ea37deb",
    "0x8fcc0456ec654523014580e3d7dfe4ac265d7f02",
    "0x5acc4bb3d241cb19501c3a56c16c436028711f85",
    "0x2a5107ae3163188431cb791860ef1c58d97a0bcf",
    "0x484b2a9e5634ee589bc1ed05636c0948702be1f1",
    "0xf149d0f27355cc58b49d74926f777de96ca15aef",
    "0xe475b17d58342c5ce08a0d1c8c924a62cc5b5294",
    "0x8500e304e1aa3fe10e1755c80ee76d5f6e2936ea",
    "0x507cd9bd71818511d2e9398a0b37d9557efdfd3d"
    ];

    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new();
    
    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};