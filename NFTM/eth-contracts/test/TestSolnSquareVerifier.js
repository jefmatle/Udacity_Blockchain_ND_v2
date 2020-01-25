const Verifier = artifacts.require('Verifier');
const SolnSquareVerifier = artifacts.require('SolnSquareVerifier');
const proof = require('../../zokrates/code/square/proof.json');

contract('SolnSquareVerifier', accounts => {
    const account1 = accounts[0];

    const a = proof["proof"]["a"];
    const b = proof["proof"]["b"];
    const c = proof["proof"]["c"];
    const correctProofInput = proof["inputs"];

    let propertyName = "Udacity Properties";
    let propertySymbol = "*";
    let propertyBaseURI = "https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/";

    describe('Test SolnSquareVerifier', function () {
        beforeEach(async function () {
            this.VerifierContract = await Verifier.new({from: account1});
            this.SolnSquareVerifierContract = await SolnSquareVerifier.new(this.VerifierContract.address, propertyName, propertySymbol, propertyBaseURI, {from: account1});
        });

        // Test if a new solution can be added for contract - SolnSquareVerifier
        it('Test if a new solution can be added for contract', async function () {
            let txObject = await this.SolnSquareVerifierContract.addSolution(a, b, c, correctProofInput, account1);
            let event = txObject.logs[0].event;
            assert.equal("solutionAdded", event, "Can't add solution");
        });

        // Test if an ERC721 token can be minted for contract - SolnSquareVerifier
        it('Test if an ERC721 token can be minted for contract', async function () {
            let txObject = await this.SolnSquareVerifierContract.mintNewToken(a, b, c, correctProofInput, account1, 1);
            let event = txObject.logs[1].event;
            assert.equal("Transfer", event, "Can't mint a token");
        });

    });
});