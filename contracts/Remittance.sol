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

    // passhash is the hash of pass1, pass2, and exchangeAddress
    // exchangeAddress is the address of the exchange who will request the withdrawal
    function addFunds(bytes32 passHash) payable public whenNotPaused {
        require(msg.value>0, "Amount stored cannot be zero");
        require(funds[passHash]!=0, "Passwords already in use");
        funds[passHash] = msg.value;
        emit LogFundsAdded(msg.sender, msg.value, passHash);
    }

    function releaseFunds(bytes32 pass1, bytes32 pass2) public whenNotPaused {
        bytes32 passHash = keccak256(abi.encodePacked(pass1,pass2,msg.sender));
        require(amount > 0, "No funds available");
        funds[passHash] = 0;
        emit LogFundsReleased(msg.sender, amount);
        msg.sender.transfer(amount);
    }
}