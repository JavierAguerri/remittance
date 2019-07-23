pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';


contract Remittance is Pausable {
    using SafeMath for uint256;

    mapping (bytes32 => uint) public funds;

    event LogFundsAdded (
        address indexed sender,
        uint value,
        bytes32 indexed hashedHashes
    );

    event LogFundsReleased (
        address indexed sender,
        uint value
    );

    event LogHash (
        bytes32 indexed passHash
    );

    function addFunds(bytes32 passHash) payable public whenNotPaused {
        require(msg.value>0, "Amount stored cannot be zero");
        funds[passHash] = funds[passHash].add(msg.value);
        emit LogFundsAdded(msg.sender, msg.value, passHash);
    }

    function testHash (string memory input1, string memory input2) public whenNotPaused {
        bytes32 passHash = hash2psswds(input1,input2);
        emit LogHash(passHash);
    }

    function hash2psswds(string memory input1, string memory input2) private view whenNotPaused returns (bytes32 passHash){
        passHash = keccak256(abi.encodePacked(input1,input2));
    }

    function releaseFunds(string memory pass1, string memory pass2) public whenNotPaused {
        bytes32 passHash = hash2psswds(pass1,pass2);
        uint amount = funds[passHash];
        require(amount > 0, "No funds available");
        funds[passHash] = 0;
        emit LogFundsReleased(msg.sender, amount);
        msg.sender.transfer(amount);
    }
}