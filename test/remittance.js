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

  // If the pass strings are only made up of numbers, the tests will not be valid. I think it is related to the fact that
  // toHex function treats strings made of numbers as a number, but I do not know how to force to treat it as UTF8 encoding
  const pass1 = "123456b";
  const pass2 = "456789a";
  const pass1Hex = web3.utils.toHex(pass1);
  const pass2Hex = web3.utils.toHex(pass2);
  const passHex = web3.utils.toHex(pass1+pass2);
  console.log(pass1Hex);
  console.log(pass2Hex);
  console.log(passHex);

  const passHash = web3.utils.soliditySha3(passHex);
  console.log("HashedHash: ", passHash);
  const pass3 = "147852";
  const pass4 = "369852";
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