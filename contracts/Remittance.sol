pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';


contract Remittance is Pausable {
    using SafeMath for uint256;

    mapping (bytes32 => uint) public funds;
    mapping (bytes32 => address) public authAddresses;

    event LogFundsAdded (
        address indexed sender,
        uint value,
        bytes32 indexed hashedHashes
    );

    event LogAddressAdded (
        address indexed sender,
        bytes32 indexed signature
    );

    event LogFundsReleased (
        address indexed sender,
        uint value
    );

    function addFunds(bytes32 hashpass1, bytes32 hashpass2) payable public whenNotPaused {
        require(hashpass1!=keccak256(abi.encodePacked("")), "Password 1 cannot be empty");
        require(hashpass2!=keccak256(abi.encodePacked("")), "Password 2 cannot be empty");
        require(msg.value>0, "Amount stored cannot be zero");
        bytes32 hashedHashes = keccak256(abi.encodePacked(hashpass1, hashpass2));
        funds[hashedHashes] = funds[hashedHashes].add(msg.value);
        emit LogFundsAdded(msg.sender, msg.value, hashedHashes);
    }

    // Before claiming the funds, the exchange shop submits a signature made of pass1, pass2 and the claiming address
    // This will prevent an attacker from listening the network to submit a faster "releaseFunds" and steal the funds
    // once the releaseFunds method is called by the legit user, the attacker could take the passwords and launch his own
    // addAddress+releaseFunds, but since those are 2 methods to execute the chances are slimmer.

    function addAddress(bytes32 signature) public whenNotPaused {
        authAddresses[signature] = msg.sender;
        emit LogAddressAdded(msg.sender, signature);
    }

    // why inputSignature as a separate parameter? Because for some reason keccak256 function yields a different result in Solidity and in truffle
    // when inputting multiple parameters (it works fine with only 1 parameter). The workaround that I found was to pass an already joined string
    // to solidity and pass it to keccak256. Suggestions and explanations are very welcome!!

    function releaseFunds(string memory pass1, string memory pass2, string memory inputSignature) public whenNotPaused {
        bytes32 hashpass1 = keccak256(abi.encodePacked(pass1));
        bytes32 hashpass2 = keccak256(abi.encodePacked(pass2));
        bytes32 hashedHashes = keccak256(abi.encodePacked(hashpass1, hashpass2));
        uint amount = funds[hashedHashes];
        require(amount > 0, "No funds available");
        bytes32 signature = keccak256(abi.encodePacked(inputSignature));
        address receiver = authAddresses[signature];
        require(authAddresses[signature] == msg.sender, "Wrong address");
        funds[hashedHashes] = 0;
        emit LogFundsReleased(msg.sender, amount);
        authAddresses[signature] = address(0);
        msg.sender.transfer(amount);
    }
}