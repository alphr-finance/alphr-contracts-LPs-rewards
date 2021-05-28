/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, network, upgrades } from 'hardhat';
import { Rewards } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
  ALPHR_UNISWAP_V3_POOL,
} from '../../constants/uniswaps';
import { TX_RECEIPT_OK } from '../../constants/tx-status';
import { ALPHR_TOKEN } from '../../constants/tokens';

describe('Reward :: test batch ETH transfer', () => {
  let deployer, userA, userB, userC, ethVault: SignerWithAddress;
  let rewards: Rewards;

  before(
    'init signers',
    async () =>
      ([deployer, userA, userB, userC, ethVault] = await ethers.getSigners())
  );

  before(
    'deploy LPs rewards contract',
    async () =>
      (rewards = await ethers
        .getContractFactory('Rewards')
        .then((rewardsContractFactory) =>
          rewardsContractFactory.connect(deployer)
        )
        .then((rewardsContractFactory) =>
          upgrades.deployProxy(rewardsContractFactory, [
            UNISWAP_V3_FACTORY,
            UNISWAP_V3_NFT_POSITION_MANAGER,
            ALPHR_TOKEN,
            ALPHR_UNISWAP_V3_POOL,
          ])
        )
        .then((rewardsContract) => rewardsContract.deployed())
        .then((rewardsDeployedContract) => rewardsDeployedContract as Rewards))
  );

  before('zero userA and userB and userC eth addresses', async () => {
    const startingNodeBalance = ethers.utils.parseEther('10000');
    await userA.sendTransaction({
      to: ethVault.address,
      value: startingNodeBalance,
      gasPrice: 0,
    });
    await userB.sendTransaction({
      to: ethVault.address,
      value: startingNodeBalance,
      gasPrice: 0,
    });

    await userC.sendTransaction({
      to: ethVault.address,
      value: startingNodeBalance,
      gasPrice: 0,
    });
  });

  before('send ethers for rewards contract', async () => {
    await ethVault.sendTransaction({
      to: rewards.address,
      value: ethers.utils.parseEther('1000'),
    });
  });

  it('successful ether tokens to users', async () => {
    let userAddresses = [userA.address, userB.address];
    let userAmounts = [
      ethers.utils.parseEther('10'),
      ethers.utils.parseEther('20'),
    ];
    const txLocal = await rewards.batchETHTransfer(userAddresses, userAmounts);
    const txrLocal = await txLocal.wait();
    expect(txrLocal.status).to.be.eq(TX_RECEIPT_OK);
  });

  it('balances of userA and userB raised on 10 and 20 accordingly', async () => {
    expect(
      (await ethers.provider.getBalance(userA.address)).toString()
    ).to.be.eq(ethers.utils.parseEther('10'));

    expect(
      (await ethers.provider.getBalance(userB.address)).toString()
    ).to.be.eq(ethers.utils.parseEther('20'));
    expect(
      (await ethers.provider.getBalance(rewards.address)).toString()
    ).to.be.eq(ethers.utils.parseEther('970'));
  });

  it('revert batchTransfer when array length does not match', async () => {
    let userAddresses = [userA.address, userB.address];
    let userAmounts = [ethers.utils.parseEther('10')];
    await expect(
      rewards.batchETHTransfer(userAddresses, userAmounts)
    ).to.be.revertedWith('Arrays must have the same length');
  });

  it('revert batchTransfer when array is empty', async () => {
    let userAddresses = [];
    let userAmounts = [];
    await expect(
      rewards.batchETHTransfer(userAddresses, userAmounts)
    ).to.be.revertedWith('Arrays must have at least one element');
  });

  it('revert batch transfer while calling from non-owner', async () => {
    let userAddresses = [userA.address, userB.address];
    let userAmounts = [
      ethers.utils.parseEther('10'),
      ethers.utils.parseEther('20'),
    ];
    await expect(
      rewards.connect(userA).batchETHTransfer(userAddresses, userAmounts)
    ).to.be.reverted;
  });

  describe('Reward :: test batch transfer for 200 signers', () => {
    let users: SignerWithAddress[] = [];
    before('init batch transferrecipients', async () => {
      for (let i = 0; i < 200; i++) {
        users.push(userC);
      }
    });

    it('successful transfer ETH to users', async () => {
      let transferSum = ethers.utils.parseEther('1');
      let userAddresses = [];
      let userAmounts = [];
      for (let i in users) {
        userAddresses.push(users[i].address);
      }
      for (let i = 0; i < 200; i++) {
        userAmounts.push(transferSum);
      }
      const txLocal = await rewards.batchETHTransfer(
        userAddresses,
        userAmounts
      );
      const txrLocal = await txLocal.wait();
      expect(txrLocal.status).to.be.eq(TX_RECEIPT_OK);
    });

    it('user balance increased', async () => {
      let expectedAmount = ethers.utils.parseEther('200');

      await ethers.provider
        .getBalance(userC.address)
        .then((balance) => expect(balance).to.be.eq(expectedAmount));
    });
  });
  after('reset node fork', async () => {
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl:
              'https://eth-mainnet.alchemyapi.io/v2/iHddcEw1BVe03s2BXSQx_r_BTDE-jDxB',
            blockNumber: 12472213,
          },
        },
      ],
    });
  });
});
