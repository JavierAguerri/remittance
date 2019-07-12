pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';


contract Remittance is Pausable {
    using SafeMath for uint256;

    mapping (bytes32 => uint) public funds;

    constructor() public {

    }

    event LogFundsAdded (
        address indexed sender,
        uint value,
        bytes32 indexed hashedPass
    );

    event LogFundsReleased (
        address indexed sender,
        uint value
    );

    function addFunds(uint32 pass1, uint32 pass2) payable public whenNotPaused {
    	require(pass1!=0, "Password 1 cannot be empty");
    	require(pass2!=0, "Password 2 cannot be empty");
    	require(msg.value>0, "Amount stored cannot be zero");
    	bytes32 hashedPass = keccak256(abi.encodePacked(pass1, pass2));
    	funds[hashedPass] = funds[hashedPass].add(msg.value);
    	emit LogFundsAdded(msg.sender, msg.value, hashedPass);
    }

    function releaseFunds(uint32 pass1, uint32 pass2) public whenNotPaused {
    	bytes32 hashedPass = keccak256(abi.encodePacked(pass1, pass2));
    	uint amount = funds[hashedPass];
        require(amount > 0, "No funds available");
        funds[hashedPass] = 0;
	    emit LogFundsReleased(msg.sender, amount);
        msg.sender.transfer(amount);
    }
}