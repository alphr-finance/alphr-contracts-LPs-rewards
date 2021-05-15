/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, providers } from 'hardhat';
import { expect } from 'chai';
import { Rewards } from '../../typechain/Rewards';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TX_RECEIPT_OK } from '../../constants/tx-status';
import { UNISWAP_V3_FACTORY } from '../../constants/uniswaps';
import {
  deployMockContract,
  MockContract,
} from '@ethereum-waffle/mock-contract';

const UNI = require('../../artifacts/@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json');

describe('Lp get tokens test suite', () => {
  let deployer, uniswap, user: SignerWithAddress;
  let rewards: Rewards;
  let uniswapMock: MockContract;
  let rewDeployTx: providers.TransactionReceipt;

  before('init signers', async () => {
    [deployer, uniswap, user] = await ethers.getSigners();
  });
  before('deploy lp contract', async () => {
    //TODO: delete after this values will be added into constants
    uniswapMock = await deployMockContract(uniswap, UNI.abi);
    const Rewards = await ethers.getContractFactory('Rewards');
    rewards = (await Rewards.connect(deployer).deploy(
      UNISWAP_V3_FACTORY,
      uniswapMock.address
    )) as Rewards;
    await rewards.deployed();
    rewDeployTx = await rewards.deployTransaction.wait();
  });
  before('mock uniswap', async () => {
    await uniswapMock.mock.positions.returns(
      0,
      user.address,
      user.address,
      user.address,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    );
    await uniswapMock.mock.getApproved.returns(rewards.address);
    await uniswapMock.mock.transferFrom.returns();
  });
  it('lp OK deploy', async () => {
    expect(rewDeployTx.status).to.eq(TX_RECEIPT_OK);
  });

  it('reverted unstake when user does not have staked  tokens', async () => {
    await expect(rewards.connect(user).unstake(1)).to.be.revertedWith(
      'User must have staked tokens'
    );
  });

  it('revert when trying to stake token that is not owned by user', async () => {
    await rewards.connect(user).stake(1);
    await expect(rewards.connect(user).unstake(2)).to.be.revertedWith(
      'User must owned this token'
    );
  });

  it('NewUnstake emitted during unstake', async () => {
    const tx = await rewards.connect(user).unstake(1);
    const txr = await tx.wait();
    const expectedEventName =
      rewards.interface.events['NewUnstake(uint256,address)'].name;
    expect(txr.events[0].event).eq(expectedEventName);
  });

  it('getUserTokens returned length 0 and empty array after unstake', async () => {
    let tokens = await rewards.connect(user).getUserTokens();
    expect(tokens.length).eq(0);
    expect(tokens.toString()).eq('');
  });
});
