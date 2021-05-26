/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers } from 'hardhat';
import { Rewards } from '../../typechain';
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
  let rew: Rewards;
  let alphr;
  before('init signers', async () => {
    [deployer, user] = await ethers.getSigners();
  });
  before('get alphr token', async () => {
    const erc20Mock = await ethers.getContractFactory('ERC20Mock');
    alphr = await erc20Mock.connect(deployer).deploy('MockToken', 'MT', 18);
    await alphr.deployed();
  });

  before('deploy rewards contract', async () => {
    const Rewards = await ethers.getContractFactory('Rewards');
    rew = (await Rewards.connect(deployer).deploy(
      UNISWAP_V3_FACTORY,
      UNISWAP_V3_NFT_POSITION_MANAGER,
      alphr.address,
      ALPHR_UNISWAP_V3_POOL
    )) as Rewards;
    await rew.deployed();
  });

  before('mint tokens for rewards contract', async () => {
    await (
      await alphr.mintTo(
        ethers.utils.parseUnits('100', await alphr.decimals()),
        rew.address
      )
    ).wait();
  });

  it('check rewards contract balance', async () => {
    expect((await alphr.balanceOf(rew.address)).toString()).to.be.eq(
      ethers.utils.parseUnits('100', await alphr.decimals())
    );
  });

  it('successfull transfer tokens to users', async () => {
    let userAddresses = [user.address, deployer.address];
    let userAmounts = [
      ethers.utils.parseUnits('10', await alphr.decimals()),
      ethers.utils.parseUnits('20', await alphr.decimals()),
    ];
    const txLocal = await rew.batchTransfer(userAddresses, userAmounts);
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
    expect((await alphr.balanceOf(rew.address)).toString()).to.be.eq(
      ethers.utils.parseUnits('70', await alphr.decimals())
    );
  });

  it('revert batchTransfer when array length does not match', async () => {
    let userAddresses = [user.address, deployer.address];
    let userAmounts = [ethers.utils.parseUnits('10', await alphr.decimals())];
    await expect(
      rew.batchTransfer(userAddresses, userAmounts)
    ).to.be.revertedWith('Arrays must have the same length');
  });

  it('revert batchTransfer when array is empty', async () => {
    let userAddresses = [];
    let userAmounts = [];
    await expect(
      rew.batchTransfer(userAddresses, userAmounts)
    ).to.be.revertedWith('Arrays must have at least one element');
  });

  it('revert batch transfer while calling from non-owner', async () => {
    let userAddresses = [user.address, deployer.address];
    let userAmounts = [
      ethers.utils.parseUnits('10', await alphr.decimals()),
      ethers.utils.parseUnits('20', await alphr.decimals()),
    ];
    await expect(rew.connect(user).batchTransfer(userAddresses, userAmounts)).to
      .be.reverted;
  });
});
