/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, upgrades } from 'hardhat';
import { ERC20Mock, Rewards } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
  ALPHR_UNISWAP_V3_POOL,
} from '../../constants/uniswaps';
import { TX_RECEIPT_OK } from '../../constants/tx-status';

describe('Reward :: test batch trasfer for mock tokens', () => {
  let deployer, user: SignerWithAddress;
  let rewards: Rewards;
  let alphr: ERC20Mock;

  before(
    'init signers',
    async () => ([deployer, user] = await ethers.getSigners())
  );

  before('get alphr token', async () => {
    alphr = await ethers
      .getContractFactory('ERC20Mock')
      .then((factory) =>
        factory.connect(deployer).deploy('MockToken', 'MT', 18)
      )
      .then((contract) => contract.deployed())
      .then((deployedContract) => deployedContract as ERC20Mock);
  });

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
            alphr.address,
            ALPHR_UNISWAP_V3_POOL,
          ])
        )
        .then((rewardsContract) => rewardsContract.deployed())
        .then((rewardsDeployedContract) => rewardsDeployedContract as Rewards))
  );

  before('mint tokens for rewards contract', async () => {
    await alphr.mintTo(
      ethers.utils.parseUnits('100', await alphr.decimals()),
      rewards.address
    );
  });

  it('check rewards contract balance', async () => {
    expect((await alphr.balanceOf(rewards.address)).toString()).to.be.eq(
      ethers.utils.parseUnits('100', await alphr.decimals())
    );
  });

  it('successful transfer tokens to users', async () => {
    let userAddresses = [user.address, deployer.address];
    let userAmounts = [
      ethers.utils.parseUnits('10', await alphr.decimals()),
      ethers.utils.parseUnits('20', await alphr.decimals()),
    ];
    const txLocal = await rewards.batchTransfer(userAddresses, userAmounts);
    const txrLocal = await txLocal.wait();
    expect(txrLocal.status).to.be.eq(TX_RECEIPT_OK);
  });

  it('balances of user and deployer raised on 10 and 20 accordingly', async () => {
    expect((await alphr.balanceOf(user.address)).toString()).to.be.eq(
      ethers.utils.parseUnits('10', await alphr.decimals())
    );
    expect((await alphr.balanceOf(deployer.address)).toString()).to.be.eq(
      ethers.utils.parseUnits('20', await alphr.decimals())
    );
    expect((await alphr.balanceOf(rewards.address)).toString()).to.be.eq(
      ethers.utils.parseUnits('70', await alphr.decimals())
    );
  });

  it('revert batchTransfer when array length does not match', async () => {
    let userAddresses = [user.address, deployer.address];
    let userAmounts = [ethers.utils.parseUnits('10', await alphr.decimals())];
    await expect(
      rewards.batchTransfer(userAddresses, userAmounts)
    ).to.be.revertedWith('Arrays must have the same length');
  });

  it('revert batchTransfer when array is empty', async () => {
    let userAddresses = [];
    let userAmounts = [];
    await expect(
      rewards.batchTransfer(userAddresses, userAmounts)
    ).to.be.revertedWith('Arrays must have at least one element');
  });

  it('revert batch transfer while calling from non-owner', async () => {
    let userAddresses = [user.address, deployer.address];
    let userAmounts = [
      ethers.utils.parseUnits('10', await alphr.decimals()),
      ethers.utils.parseUnits('20', await alphr.decimals()),
    ];
    await expect(
      rewards.connect(user).batchTransfer(userAddresses, userAmounts)
    ).to.be.reverted;
  });

  describe('Reward :: test batch transfer for 200 signers', () => {
    let users: SignerWithAddress[] = [];
    before('init batch transferrecipients', async () => {
      for (let i = 0; i < 200; i++) {
        const [user1] = await ethers.getSigners();
        users.push(user1);
      }
    });
    before('mint tokens for rewards contract', async () => {
      await alphr.mintTo(
        ethers.utils.parseUnits('130', await alphr.decimals()),
        rewards.address
      );
    });
    it('successful transfer tokens to users', async () => {
      let transferSum = ethers.utils.parseUnits('1', await alphr.decimals());
      let userAddresses = [];
      let userAmounts = [];
      for (let i in users) {
        userAddresses.push(users[i].address);
      }
      for (let i = 0; i < 200; i++) {
        userAmounts.push(transferSum);
      }
      const txLocal = await rewards.batchTransfer(userAddresses, userAmounts);
      const txrLocal = await txLocal.wait();
      expect(txrLocal.status).to.be.eq(TX_RECEIPT_OK);
    });
    it('rewards contract balance is empty after transfer', async () => {
      await alphr
        .balanceOf(rewards.address)
        .then((balance) => expect(balance).to.be.eq('0'));
    });

    it('user balance increased', async () => {
      let expectedAmount = ethers.utils.parseUnits(
        '220',
        await alphr.decimals()
      );
      await alphr
        .balanceOf(users[1].address)
        .then((balance) => expect(balance).to.be.eq(expectedAmount));
    });
  });
});
