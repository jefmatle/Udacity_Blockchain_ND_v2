import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

let STATUS_CODES = [{
  "label": "STATUS_CODE_UNKNOWN",
  "code": 0
}, {
  "label": "STATUS_CODE_ON_TIME",
  "code": 10
}, {
  "label": "STATUS_CODE_LATE_AIRLINE",
  "code": 20
}, {
  "label": "STATUS_CODE_LATE_WEATHER",
  "code": 30
}, {
  "label": "STATUS_CODE_LATE_TECHNICAL",
  "code": 40
}, {
  "label": "STATUS_CODE_LATE_OTHER",
  "code": 50
}];

function initAccounts() {
    return new Promise((resolve, reject) => {
        web3.eth.getAccounts().then(accounts => {
            web3.eth.defaultAccount = accounts[0];
            flightSuretyApp.methods.activateAirline(accounts[1]).send({
                from: accounts[1],
                value: "10000000000000000000",
                gas: 4712388,
                gasPrice: 100000000000
            }).then(() => {
                initREST();
            }).catch(err => {
                console.log(err.message);
            }).then(() => {
                resolve(accounts);
            });
        }).catch(err => {
            reject(err);
        });
    });
}

function initOracles(accounts) {
    return new Promise((resolve, reject) => {
        let rounds = accounts.length;
        let oracles = [];
        flightSuretyApp.methods.REGISTRATION_FEE().call().then(fee => {
            accounts.forEach(account => {
                flightSuretyApp.methods.registerOracle().send({
                    from: account,
                    value: fee,
                    gas: 4712388,
                    gasPrice: 100000000000
                }).then(() => {
                    flightSuretyApp.methods.getMyIndexes().call({
                        from: account
                    }).then(result => {
                        oracles.push(result);
                        rounds -= 1;
                        if (!rounds) {
                            resolve(oracles);
                        }
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(err => {
                    reject(err);
                });
            });
        }).catch(err => {
            reject(err);
        });
    });
}

initAccounts().then(accounts => {
    initREST();
    initOracles(accounts).then(oracles => {
        flightSuretyData.events.insurancePurchased({
            fromBlock: "latest"
        }, function (error, result) {
            if (error) {
                console.log(error)
            }

            let airline = result.returnValues.airline;
            let flight = result.returnValues.flight;
            let timestamp = result.returnValues.timestamp;
            let scheduledTime = (timestamp * 1000);
            let selectedCode = STATUS_CODES[1];
            if (scheduledTime < Date.now()) {
                selectedCode = STATUS_CODES[2];
            }

            let isOracleResponseSubmitted = false;
            oracles.forEach((oracle, index) => {
                if(!isOracleResponseSubmitted) {
                    for(let i = 0; i < 3; i += 1) {
                        if(isOracleResponseSubmitted) {
                            break;
                        }
                        if (i === 0 && selectedCode.code === 20) {
                            flightSuretyApp.methods.creditInsurees(airline, flight, timestamp, accounts[index]).send({
                                from: accounts[index]
                            }).then(result => {
                            }).catch(err => {
                                console.log(err.message);
                            });
                        }
                        flightSuretyApp.methods.submitOracleResponse(oracle[i], airline, flight, timestamp, selectedCode.code).send({
                            from: accounts[index]
                        }).then(result => {
                            isOracleResponseSubmitted = true;
                        }).catch(err => {

                        });
                    }
                }
            });
        });
    }).catch(err => {
        console.log(err.message);
    });
}).catch(err => {
    console.log(err.message);
});

function initREST() {
    app.get('/api', (req, res) => {
        res.send({
            message: 'An API for use with your Dapp!'
        });
    });

    app.get("/activeAirlines", (req, res)  => {
        flightSuretyApp.methods.getActiveAirlines().call().then(airlines => {
            console.log(airlines);
            return res.status(200).send(airlines);
        }).catch(err => {
            return res.status(500).send(err);
        });
    });
}

/*
flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error)
    console.log(event)
});

app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})
*/

const app = express();
export default app;


