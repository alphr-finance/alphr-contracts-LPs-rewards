/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, providers } from 'hardhat';
import { expect } from 'chai';
import { Rewards } from '../../typechain/Rewards';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ContractReceipt, ContractTransaction } from 'ethers';
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
  let tx: ContractTransaction;
  let txr: ContractReceipt;

  before('init signers', async () => {
    [deployer, uniswap, user] = await ethers.getSigners();
  });
  before('deploy lp contract', async () => {
    //TODO: delete after this values will be added into constants
    uniswapMock = await deployMockContract(uniswap, UNI.abi);
    const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
    const Rewards = await ethers.getContractFactory('Rewards');
    rewards = (await Rewards.connect(deployer).deploy(
      UNISWAP_V3_FACTORY,
      uniswapMock.address
    )) as Rewards;
    await rewards.deployed();
    rewDeployTx = await rewards.deployTransaction.wait();
  });

  it('lp OK deploy', async () => {
    expect(rewDeployTx.status).to.eq(1);
  });

  it('revert unstake unstake #1', async () => {
    await expect(rewards.connect(user).unstake(1)).to.be.revertedWith(
      'User must have staked tokens'
    );
  });

  it('revert unstake #2', async () => {
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

    await rewards.connect(user).stake(1);
    await expect(rewards.connect(user).unstake(2)).to.be.revertedWith(
      'User must owned this token'
    );
  });

  it('test emitted event', async () => {
    tx = await rewards.connect(user).unstake(1);
    txr = await tx.wait();
    const expectedEventName =
      rewards.interface.events['NewUnstake(uint256,address)'].name;
    expect(txr.events[0].event).eq(expectedEventName);
    expect(await (await rewards.connect(user).getUserTokens()).length).eq(0);
  });

  it('successfull unstake', async () => {
    expect(await (await rewards.connect(user).getUserTokens()).toString()).eq(
      ''
    );
  });
});
