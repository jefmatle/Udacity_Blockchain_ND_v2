pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    address[] private airlines;
    address[] private permittedAirlines;

    mapping(address => bool) private airlinesPermission;
    mapping(address => address[]) private votes;

    struct Insurance {
        bytes32 id;
        address owner;
        uint256 amount;
        bool isRefunded;
    }
    mapping(bytes32 => Insurance) private flightInsuranceDetails;
    mapping(bytes32 => address[]) private flightInsurances;

    mapping(address => uint256) private walletBalance;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event airlineRegistered(address airline);
    event airlineFunded(address airline);
    event insurancePurchased(address airline, string flight, uint256 timestamp, address senderAddress, uint256 insuranceAmount);
    event insuranceClaimed(address airline, string flight, uint256 timestamp, address insuree, uint256 creditedAmount);
    event amountWithdrawn(address senderAddress, uint amount);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                )
                                public
    {
        contractOwner = msg.sender;
        airlines.push(msg.sender);
        airlinesPermission[msg.sender] = false;
        permittedAirlines.push(msg.sender);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    modifier requireIsRegistered(address airline)
    {
        require(isRegistered(airline), "Airline is not registered");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline
                            (
                                address newAirline
                            )
                            external
                            requireIsOperational
    {
        airlines.push(newAirline);
        airlinesPermission[newAirline] = false;
        emit airlineRegistered(newAirline);
    }

    function isAirlineRegistered
                            (
                                address newAirline
                            )
                            public
                            view
                            requireIsOperational
                            returns(bool)
    {
        bool isRegistered = false;
        for(uint i = 0; i < airlines.length; i++) {
            if(airlines[i] == newAirline) {
                isRegistered = true;
            }
        }
        return isRegistered;
    }

    function permitAirline
                            (
                                address airline
                            )
                            public
                            payable
                            requireIsOperational
    {
        airlinesPermission[airline] = true;
        permittedAirlines.push(airline);
        fund(airline);
        emit airlineFunded(airline);
    }

    function isPermitted
                            (
                                address airline
                            )
                            public
                            view
                            requireIsOperational
                            returns(bool)
    {
        return airlinesPermission[airline];
    }

    function getRegisteredAirlines()
                            public
                            view
                            requireIsOperational
                            returns(address[])
    {
        return airlines;
    }

    function getPermittedAirlines()
                            public
                            view
                            requireIsOperational
                            returns(address[])
    {
        return permittedAirlines;
    }

    function setVotes
                            (
                                address newAirline, address sender
                            )
                            public
                            requireIsOperational
                            returns(address[])
    {
        votes[newAirline].push(sender);
    }

    function getVotes
                            (
                                address newAirline
                            )
                            public
                            view
                            requireIsOperational
                            returns(address[])
    {
        return votes[newAirline];
    }

    function isVoted
                            (
                                address newAirline, address sender
                            )
                            public
                            view
                            requireIsOperational
                            returns(bool)
    {
        bool isAlreadyVoted = false;
        for(uint i = 0; i < votes[newAirline].length; i++) {
            if(votes[newAirline][i] == sender){
                isAlreadyVoted = true;
            }
        }
        return isAlreadyVoted;
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                                address airline, string flight, uint256 timestamp, address insuree, uint256 insuranceAmount
                            )
                            external
                            payable
                            requireIsOperational
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        bytes32 insuranceId = keccak256(abi.encodePacked(flightKey, insuree));
        flightInsuranceDetails[insuranceId] = Insurance({
            id: insuranceId,
            owner: insuree,
            amount: insuranceAmount,
            isRefunded: false
        });
        flightInsurances[flightKey].push(insuree);
        fund(airline);
        emit insurancePurchased(airline, flight, timestamp, insuree, insuranceAmount);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address airline, string flight, uint256 timestamp, address insuree
                                )
                                external
                                requireIsOperational
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        bytes32 insuranceId = keccak256(abi.encodePacked(flightKey, insuree));
        require(flightInsuranceDetails[insuranceId].id == insuranceId, "Not purchased the insurance.");
        require(!flightInsuranceDetails[insuranceKey].isRefunded, "Already refunded the amount.");
        uint256 currentAirlineBalance = walletBalance[airline];
        uint256 amountCreditedToInsuree = flightInsuranceDetails[insuranceId].amount.mul(15).div(10);
        require(currentAirlineBalance >= amountCreditedToInsuree, "Airline Doesn't have enough funds.");
        flightInsuranceDetails[insuranceId].isRefunded = true;
        walletBalance[airline] = currentAirlineBalance.sub(amountCreditedToInsuree);
        walletBalance[insuree] = walletBalance[insuree].add(amountCreditedToInsuree);
        emit insuranceClaimed(airline, flight, timestamp, insuree, amountCreditedToInsuree);
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address insuree
                            )
                            external
                            payable
    {
        require(walletBalance[insuree] > 0, "No credit");
        uint256 credit = walletBalance[insuree];
        walletBalance[insuree] = 0;
        insuree.transfer(credit);
        emit amountWithdrawn(insuree, credit);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (
                                address toFundAddress
                            )
                            public
                            payable
    {
        walletBalance[toFundAddress] = walletBalance[toFundAddress].add(msg.value);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        internal
                        pure
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
                            external
                            payable
    {
        fund(msg.sender);
    }


}

