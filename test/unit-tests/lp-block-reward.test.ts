/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, providers } from 'hardhat';
import { expect } from 'chai';
import { Rewards } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TX_RECEIPT_OK } from '../../constants/tx-status';
import { ALPHR_TOKEN } from '../../constants/tokens';
import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_HANDLER,
} from '../../constants/uniswaps';

describe('Lp block reward test suite', () => {
  let deployer, user: SignerWithAddress;
  let rewards: Rewards;
  let rewDeployTx: providers.TransactionReceipt;

  before('init signers', async () => {
    [deployer, user] = await ethers.getSigners();
  });

  before('deploy LPs rewards contract', async () => {
    const Rewards = await ethers.getContractFactory('Rewards');
    rewards = (await Rewards.connect(deployer).deploy(
      UNISWAP_V3_FACTORY,
      UNISWAP_V3_NFT_HANDLER,
      ALPHR_TOKEN
    )) as Rewards;
    await rewards.deployed();
    rewDeployTx = await rewards.deployTransaction.wait();
  });

  it('contract deployed sucessfully', async () => {
    expect(rewDeployTx.status).eq(TX_RECEIPT_OK);
  });

  it('get expected block reward', async () => {
    expect('0').to.be.eq((await rewards.getBlockReward()).toString());
  });

  it('set new block reward to 5 and check', async () => {
    await rewards.connect(deployer).setBlockReward(5);
    expect('5').to.be.eq((await rewards.getBlockReward()).toString());
  });

  it('try to set new block reward by non-owner and revert', async () => {
    await expect(rewards.connect(user).setBlockReward(10)).to.be.revertedWith(
      'revert Ownable: caller is not the owner'
    );
  });
});
