const Remittance = artifacts.require("Remittance");
const chai = require('chai');
const BN = web3.utils.BN;
const truffleAssert = require('truffle-assertions');
chai.use(require('chai-bn')(BN));

contract('Remittance', (accounts) => {
  console.log(accounts);
  const accountOne = accounts[0];
  const accountTwo = accounts[1];
  const accountThree = accounts[2];

  const pass1raw = "123456b";
  const pass2raw = "456789a";
  const pass1 = web3.utils.sha3(pass1raw);
  const pass2 = web3.utils.sha3(pass2raw);
  const pass2no0x = pass2.slice(2); // this was a tricky one
  console.log(pass1);
  console.log(pass2);
  const passHash = web3.utils.soliditySha3(pass1+pass2no0x);
  console.log("HashedHash: ", passHash);
  const pass3raw = "147852";
  const pass4raw = "369852";
  const pass3 = web3.utils.sha3(pass3raw);
  const pass4 = web3.utils.sha3(pass4raw);

  const accountZero = "0x0000000000000000000000000000000000000000";
  const amountBN = new BN('1000000000000',10);
  //console.log("Amount is: "+amountBN);

  beforeEach('setup contract at the beginning', async function () {
      remittanceInstance = await Remittance.new({from: accountOne});
  });

  it('should fail when releasing funds with the wrong passwords', async () => {
    await remittanceInstance.addFunds(passHash, {from: accountOne, value: amountBN});
    console.log("test 1: ",passHash);
    await remittanceInstance.testHash(pass1, pass2, {from: accountThree});
    await truffleAssert.fails(
      remittanceInstance.releaseFunds(pass3, pass4, {from: accountOne}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should work when releasing funds with the right passwords, using another account', async () => {
    await remittanceInstance.addFunds(passHash, {from: accountOne, value: amountBN});
    console.log("test 2: ",passHash);
    await remittanceInstance.testHash(pass1, pass2, {from: accountThree});
    await remittanceInstance.releaseFunds(pass1, pass2, {from: accountThree});
  });

  it('should work when releasing funds with the right passwords, using the same account', async () => {
    await remittanceInstance.addFunds(passHash, {from: accountOne, value: amountBN});
    console.log("test 3: ",passHash);
    await remittanceInstance.testHash(pass1, pass2, {from: accountThree});
    await remittanceInstance.releaseFunds(pass1, pass2, {from: accountOne});
  });


});