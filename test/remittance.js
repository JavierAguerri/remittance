const Remittance = artifacts.require("Remittance");
const chai = require('chai');
const BN = web3.utils.BN;
const truffleAssert = require('truffle-assertions');
const keccak256 = require('keccak256');
chai.use(require('chai-bn')(BN));

contract('Remittance', (accounts) => {
  console.log(accounts);
  const accountOne = accounts[0];
  const accountTwo = accounts[1];
  const accountThree = accounts[2];
  const pass1 = "123456";
  const pass2 = "456789";
  const hashpass1 = keccak256(pass1);
  const hashpass2 = keccak256(pass2);
  const inputSignature1 = pass1+pass2+accountOne;
  const signature1 = keccak256(inputSignature1);
  const inputSignature2 = pass1+pass2+accountThree;
  const signature2 = keccak256(inputSignature2);
  //console.log("HashedHash: ", keccak256(hashpass1,hashpass2));
  const pass3 = "147852";
  const pass4 = "369852";
  const hashpass3 = keccak256(pass3);
  const hashpass4 = keccak256(pass4);
  const signature3 = keccak256(pass3,pass4,accountTwo);
  const emptyhash = keccak256("");
  //console.log(emptyhash);
  const accountZero = "0x0000000000000000000000000000000000000000";
  const amountBN = new BN('1000000000000',10);
  //console.log("Amount is: "+amountBN);

  beforeEach('setup contract at the beginning', async function () {
      remittanceInstance = await Remittance.new({from: accountOne});
  });

  it('should fail when releasing funds with the wrong passwords', async () => {
    await remittanceInstance.addFunds(hashpass1, hashpass2, {from: accountOne, value: amountBN});
    await remittanceInstance.addAddress(signature1, {from: accountOne});
    await truffleAssert.fails(
      remittanceInstance.releaseFunds(pass3, pass4, inputSignature1, {from: accountOne}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should fail when releasing funds with the right passwords, using another account', async () => {
    await remittanceInstance.addFunds(hashpass1, hashpass2, {from: accountOne, value: amountBN});
    await remittanceInstance.addAddress(signature1, {from: accountOne});
    //console.log("Signature1: ",signature1);
    await truffleAssert.fails(
      remittanceInstance.releaseFunds(pass1, pass2, inputSignature1, {from: accountThree}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should work when releasing funds with the right passwords, using the same account', async () => {
    await remittanceInstance.addFunds(hashpass1, hashpass2, {from: accountOne, value: amountBN});
    await remittanceInstance.addAddress(signature1, {from: accountOne});
    //console.log("Signature1: ",signature1);
    await remittanceInstance.releaseFunds(pass1, pass2, inputSignature1, {from: accountOne});
  });

  it('should work when releasing the funds with the right passwords - check balances', async () => {

    const initialBalanceOne = await web3.eth.getBalance(accountOne);
    const initialBalanceOneBN = new BN (initialBalanceOne,10);

    const receipt0 = await remittanceInstance.addFunds(hashpass1, hashpass2, {from: accountOne, value: amountBN});
    const gasUsed0BN = new BN (receipt0.receipt.gasUsed,10);
    const tx0 = await web3.eth.getTransaction(receipt0.tx);
    const gasPrice0BN = new BN (tx0.gasPrice,10);

    const step1BalanceOne = await web3.eth.getBalance(accountOne);
    const step1BalanceOneBN = new BN (step1BalanceOne,10);

    const calc1BalanceOneBN = initialBalanceOneBN.sub(gasUsed0BN.mul(gasPrice0BN)).sub(amountBN);
    assert.strictEqual(calc1BalanceOneBN.toString(), step1BalanceOneBN.toString(), 'Account 1 balance does not match the expected - step 1');

    const receipt1 = await remittanceInstance.addAddress(signature1, {from: accountOne});
    const gasUsed1BN = new BN (receipt1.receipt.gasUsed,10);
    const tx1 = await web3.eth.getTransaction(receipt1.tx);
    const gasPrice1BN = new BN (tx1.gasPrice,10);

    const step2BalanceOne = await web3.eth.getBalance(accountOne);
    const step2BalanceOneBN = new BN (step2BalanceOne,10);

    const calc2BalanceOneBN = step1BalanceOneBN.sub(gasUsed1BN.mul(gasPrice1BN));
    assert.strictEqual(calc2BalanceOneBN.toString(), step2BalanceOneBN.toString(), 'Account 1 balance does not match the expected - step 2');

    const receipt2 = await remittanceInstance.releaseFunds(pass1, pass2, inputSignature1, {from: accountOne});
    const gasUsed2BN = new BN (receipt2.receipt.gasUsed,10);
    const tx2 = await web3.eth.getTransaction(receipt2.tx);
    const gasPrice2BN = new BN (tx2.gasPrice,10);

    const step3BalanceOne = await web3.eth.getBalance(accountOne);
    const step3BalanceOneBN = new BN (step3BalanceOne,10);

    const calc3BalanceOneBN = step2BalanceOneBN.sub(gasUsed2BN.mul(gasPrice2BN)).add(amountBN);
    assert.strictEqual(calc3BalanceOneBN.toString(), step3BalanceOneBN.toString(), 'Account 1 balance does not match the expected - step 3');

  });

  it('should fail when sending 0 Ether', async () => {
    await truffleAssert.fails(
      remittanceInstance.addFunds(hashpass1, hashpass2, {from: accountOne, value: 0}),
      truffleAssert.ErrorType.REVERT
    );
  });  

  it('should fail when sending 0 Ether', async () => {
    await truffleAssert.fails(
      remittanceInstance.addFunds(hashpass1, hashpass2, {from: accountOne, value: 0}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should fail when sending an empty password 1', async () => {
    await truffleAssert.fails(
      remittanceInstance.addFunds(emptyhash, hashpass2, {from: accountOne, value: amountBN}),
      truffleAssert.ErrorType.REVERT
    );  
  });

  it('should fail when sending an empty password 2', async () => {
    await truffleAssert.fails(
      remittanceInstance.addFunds(hashpass1, emptyhash, {from: accountOne, value: amountBN}),
      truffleAssert.ErrorType.REVERT
    );  
  });

  it('should fail executing addFunds when paused', async () => {
    await remittanceInstance.pause({from: accountOne});
    await truffleAssert.fails(
      remittanceInstance.addFunds(hashpass1, hashpass2, {from: accountOne, value: amountBN}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should fail executing releaseFunds when paused', async () => {
    await remittanceInstance.addFunds(hashpass1, hashpass2, {from: accountOne, value: amountBN});
    await remittanceInstance.pause({from: accountOne});
    await truffleAssert.fails(
      remittanceInstance.releaseFunds(pass1, pass2, inputSignature1, {from: accountOne, value: amountBN}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should be ok when pausing, executing, failing, unpausing and executing again', async () => {
    await remittanceInstance.pause({from: accountOne});
    await truffleAssert.fails(
      remittanceInstance.addFunds(hashpass1, hashpass2, {from: accountOne, value: amountBN}),
      truffleAssert.ErrorType.REVERT
    );
    await remittanceInstance.unpause({from: accountOne});
    await remittanceInstance.addFunds(hashpass1, hashpass2, {from: accountOne, value: amountBN});
  });

  it('should fail when paused by not owner', async () => {
    await truffleAssert.fails(
      remittanceInstance.pause({from: accountTwo}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should fail when unpaused by not owner', async () => {
    await remittanceInstance.pause({from: accountOne});
    await truffleAssert.fails(
      remittanceInstance.unpause({from: accountTwo}),
      truffleAssert.ErrorType.REVERT
    );
  });

});