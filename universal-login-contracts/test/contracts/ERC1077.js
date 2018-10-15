import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {solidity} from 'ethereum-waffle';
import basicIdentity, {transferMessage} from '../fixtures/basicIdentity';
import {utils} from 'ethers';
import {OPERATION_CALL} from 'universal-login-contracts/lib/consts';
import TestHelper from '../testHelper';
import calculateMessageSignature from '../../lib/calculateMessageSignature';

chai.use(chaiAsPromised);
chai.use(solidity);

const {parseEther} = utils;
const to = '0x0000000000000000000000000000000000000001';
const ETHER = '0x0000000000000000000000000000000000000000';

describe('ERC1077', async () => {
  const testHelper = new TestHelper();
  let provider;
  let identity;
  let privateKey;
  let keyAsAddress;
  let publicKey;
  let signature;
  let msg;

  beforeEach(async () => {
    ({provider, identity, privateKey, keyAsAddress, publicKey} = await testHelper.load(basicIdentity));
    msg = {...transferMessage, from: identity.address};
    signature = calculateMessageSignature(privateKey, msg);
  });

  it('properly construct', async () => {
    expect(await identity.lastNonce()).to.eq(0);
  });

  describe('signing message', () => {
    it('key exist', async () => {
      expect(await identity.keyExist(publicKey)).to.be.true;
    });

    it('key exist', async () => {
      expect(await identity.keyExist([])).to.be.false;
    });

    it('recovers signature', async () => {
      const dataHash = utils.solidityKeccak256(['bytes'], [msg.data]);
      const recoveredAddress = await identity.getSigner(msg.from, msg.to, msg.value, dataHash, msg.nonce, msg.gasPrice, msg.gasLimit, msg.gasToken, 0, '0x0000000000000000000000000000000000000000000000000000000000000000', signature);
      expect(recoveredAddress).to.eq(keyAsAddress);
    });
  });

  describe('successful execution of transfer', () => {
    it('transfers funds', async () => {
      await identity.executeSigned(to, parseEther('1.0'), [], 0, 0, 0, ETHER, OPERATION_CALL, [], signature);
      expect(await provider.getBalance(to)).to.eq(parseEther('1.0'));
      expect(await identity.lastNonce()).to.eq(1);
    });

    it('emits ExecutedSigned event', async () => {
      await expect(identity.executeSigned(to, parseEther('1.0'), [], 0, 0, 0, ETHER, OPERATION_CALL, [], signature))
        .to.emit(identity, 'ExecutedSigned')
        .withArgs('0x7c3f015a15180442dcfa779f0d3e5deebdd1ecee0774f5265f6cee86cb07dded', 0, true);
    });

    xit('refunds');
  });

  describe('fails if invalid nonce', () => {
    it('fails if nonce too low', async () => {
      await identity.executeSigned(to, parseEther('1.0'), [], 0, 0, 0, ETHER, OPERATION_CALL, [], signature);
      await expect(identity.executeSigned(to, parseEther('1.0'), [], 0, 0, 0, ETHER, OPERATION_CALL, [], signature))
        .to.be.revertedWith('Invalid nonce');
    });

    it('fails if nonce too high', async () => {
      await expect(identity.executeSigned(to, parseEther('1.0'), [], 2, 0, 0, ETHER, OPERATION_CALL, [], signature))
        .to.be.revertedWith('Invalid nonce');
    });
  });

  describe('successful execution of call', () => {
    xit('called method');
    xit('increase nonce');
    xit('refunded');
  });

  describe('successful execution of transfer (multiple keys)', () => {
    xit('transfered funds');
    xit('increase nonce');
    xit('refunded');
  });


  xdescribe('fails if not enough signatures', () => {
    xit('increase nonce');
    xit('refunded');
  });

  describe('fails if invalid signature', () => {
    it('empty signature', async () => {
      await expect(identity.executeSigned(to, parseEther('1.0'), [], 0, 0, 0, ETHER, OPERATION_CALL, [], []))
        .to.be.revertedWith('Invalid signature');
      expect(await identity.lastNonce()).to.eq(0);
      expect(await provider.getBalance(to)).to.eq(parseEther('0.0'));
    });
    xit('nonce not increased');
    xit('refunded');
  });

  xdescribe('fails if call fails', () => {
    xit('increase nonce');
    xit('refunded');
  });

  xdescribe('fails if not enough balance to refund', () => {
    xit('increase nonce');
    xit('refunded');
  });

  xdescribe('successful execution of create');
  xdescribe('successful execution of delegate call');
});