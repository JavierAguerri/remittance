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
  const pass1 = 123456;
  const pass2 = 456789;
  const pass3 = 147852;
  const pass4 = 369852;
  const accountZero = "0x0000000000000000000000000000000000000000";
  const amountBN = new BN('1000000000000',10);
  console.log("Amount is: "+amountBN);

  beforeEach('setup contract at the beginning', async function () {
      remittanceInstance = await Remittance.new({from: accountOne});
  });

  it('should fail when releasing funds with the wrong passwords', async () => {
    await remittanceInstance.addFunds(pass1, pass2, {from: accountOne, value: amountBN});
    await truffleAssert.fails(
      remittanceInstance.releaseFunds(pass3, pass4, {from: accountOne}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should work when releasing funds with the right passwords, using whatever account', async () => {
    await remittanceInstance.addFunds(pass1, pass2, {from: accountOne, value: amountBN});
    await remittanceInstance.releaseFunds(pass1, pass2, {from: accountThree});
  });

// TERMINAR
  it('should work when releasing the funds with the right passwords - check balances', async () => {

//    await remittanceInstance.addFunds(pass1, pass2, {from: accountOne, value: amountBN});
    const initialBalanceOne = await web3.eth.getBalance(accountOne);
    const initialBalanceOneBN = new BN (initialBalanceOne,10);
    const receipt0 = await remittanceInstance.addFunds(pass1, pass2, {from: accountOne, value: amountBN});
    const gasUsed0BN = new BN (receipt0.receipt.gasUsed,10);
    const tx0 = await web3.eth.getTransaction(receipt0.tx);
    const gasPrice0BN = new BN (tx0.gasPrice,10);

    const step1BalanceOne = await web3.eth.getBalance(accountOne);
    const step1BalanceOneBN = new BN (step1BalanceOne,10);

    const calc1BalanceOneBN = initialBalanceOneBN.sub(gasUsed0BN.mul(gasPrice0BN)).sub(amountBN);
    assert.strictEqual(calc1BalanceOneBN.toString(), step1BalanceOneBN.toString(), 'Account 1 balance does not match the expected - step 1');

    const receipt1 = await remittanceInstance.releaseFunds(pass1, pass2, {from: accountOne});
    const gasUsed1BN = new BN (receipt1.receipt.gasUsed,10);
    const tx1 = await web3.eth.getTransaction(receipt1.tx);
    const gasPrice1BN = new BN (tx1.gasPrice,10);

    const step2BalanceOne = await web3.eth.getBalance(accountOne);
    const step2BalanceOneBN = new BN (step2BalanceOne,10);

    const calc2BalanceOneBN = step1BalanceOneBN.sub(gasUsed1BN.mul(gasPrice1BN)).add(amountBN);
    assert.strictEqual(calc2BalanceOneBN.toString(), step2BalanceOneBN.toString(), 'Account 1 balance does not match the expected - step 2');

  });

  it('should fail when sending 0 Ether', async () => {
    await truffleAssert.fails(
      remittanceInstance.addFunds(pass1, pass2, {from: accountOne, value: 0}),
      truffleAssert.ErrorType.REVERT
    );
  });  

  it('should fail when sending 0 Ether', async () => {
    await truffleAssert.fails(
      remittanceInstance.addFunds(pass1, pass2, {from: accountOne, value: 0}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should fail when sending an empty password 1', async () => {
    await truffleAssert.fails(
      remittanceInstance.addFunds(0, pass2, {from: accountOne, value: amountBN}),
      truffleAssert.ErrorType.REVERT
    );  
  });

  it('should fail when sending an empty password 2', async () => {
    await truffleAssert.fails(
      remittanceInstance.addFunds(pass1, 0, {from: accountOne, value: amountBN}),
      truffleAssert.ErrorType.REVERT
    );  
  });

  it('should fail executing addFunds when paused', async () => {
    await remittanceInstance.pause({from: accountOne});
    await truffleAssert.fails(
      remittanceInstance.addFunds(pass1, pass2, {from: accountOne, value: amountBN}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should fail executing releaseFunds when paused', async () => {
    await remittanceInstance.addFunds(pass1, pass2, {from: accountOne, value: amountBN});
    await remittanceInstance.pause({from: accountOne});
    await truffleAssert.fails(
      remittanceInstance.releaseFunds(pass1, pass2, {from: accountOne, value: amountBN}),
      truffleAssert.ErrorType.REVERT
    );
  });

  it('should be ok when pausing, executing, failing, unpausing and executing again', async () => {
    await remittanceInstance.pause({from: accountOne});
    await truffleAssert.fails(
      remittanceInstance.addFunds(pass1, pass2, {from: accountOne, value: amountBN}),
      truffleAssert.ErrorType.REVERT
    );
    await remittanceInstance.unpause({from: accountOne});
    await remittanceInstance.addFunds(pass1, pass2, {from: accountOne, value: amountBN});
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