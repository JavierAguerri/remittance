pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract Remittance is Pausable {
    using SafeMath for uint256;

    mapping (bytes32 => uint) public funds;
    mapping (bytes32 => bytes32) public signatures; // signature -> passHash

    event LogFundsAdded (
        address indexed sender,
        uint value,
        bytes32 indexed hashedHashes
    );

    event LogFundsReleased (
        address indexed sender,
        uint value
    );

    event LogSignature (
        bytes32 indexed signature
    );

    function addFunds(bytes32 passHash) payable public whenNotPaused {
        require(msg.value>0, "Amount stored cannot be zero");
        require(funds[passHash]!=0, "Passwords already in use");
        funds[passHash] = msg.value;
        emit LogFundsAdded(msg.sender, msg.value, passHash);
    }

    function hash2psswds(bytes32 input1, bytes32 input2) private view returns (bytes32 passHash){
        passHash = keccak256(abi.encodePacked(input1,input2));
    }

    function addSignature (bytes32 passHash, bytes32 signature) payable public whenNotPaused {
        // the passHash lock is necessary to prevent miners from taking passwords from releaseFunds and drain the funds
        require (signatures[passHash] == 0, "passHash already claimed"); 
        signatures[passHash] = signature;
    }

    function releaseFunds(bytes32 pass1, bytes32 pass2) public whenNotPaused {
        bytes32 signature = keccak256(abi.encodePacked(pass1,pass2,msg.sender));
        bytes32 passHash = hash2psswds(pass1,pass2);
        // if the signature is wrong, unlock the signatures mapping so it can be claimed again
        if (signatures[passHash] != signature) {
            signatures[passHash] = 0;
        }
        require(signatures[passHash] == signature, "Wrong address");
        uint amount = funds[passHash];
        require(amount > 0, "No funds available");
        funds[passHash] = 0;
        emit LogFundsReleased(msg.sender, amount);
        msg.sender.transfer(amount);
    }
}