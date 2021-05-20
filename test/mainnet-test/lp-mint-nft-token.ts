/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, network } from 'hardhat';
import { utils } from 'ethers';
import { ContractTransaction, ContractReceipt } from 'ethers';
import { Rewards } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_HANDLER,
} from '../../constants/uniswaps';

import { INonfungiblePositionManager } from '../../typechain/INonfungiblePositionManager';
import { ALPHR_TOKEN, WETH9 } from '../../constants/tokens';
import { FeeAmount, MaxUint128, TICK_SPACINGS } from '../shared/constants';
import { getMinTick, getMaxTick } from '../shared/ticks';
import { encodePriceSqrt } from '../shared/encodePriceSqrt';
import { IERC20 } from '../../typechain/IERC20';
import { BigNumber } from 'ethers';

describe('Reward :: test reward contract', () => {
  let deployer, user: SignerWithAddress;
  let rew: Rewards;
  let tx: ContractTransaction;
  let txr: ContractReceipt;
  let nonFungibleManager: INonfungiblePositionManager;
  let alphr, weth: IERC20;
  let _id: BigNumber;
  before('init signers', async () => {
    [deployer, user] = await ethers.getSigners();
  });

  before('deploy rewards contract', async () => {
    const Rewards = await ethers.getContractFactory('Rewards');
    rew = (await Rewards.connect(deployer).deploy(
      UNISWAP_V3_FACTORY,
      UNISWAP_V3_NFT_HANDLER,
      ALPHR_TOKEN
    )) as Rewards;
    await rew.deployed();
  });

  before('create nft manager', async () => {
    nonFungibleManager = (await ethers.getContractAt(
      'INonfungiblePositionManager',
      UNISWAP_V3_NFT_HANDLER
    )) as INonfungiblePositionManager;
    await (
      await nonFungibleManager.createAndInitializePoolIfNecessary(
        ALPHR_TOKEN,
        WETH9,
        FeeAmount.MEDIUM,
        encodePriceSqrt(1, 1)
      )
    ).wait();
  });

  before('get alphr token', async () => {
    alphr = (await ethers.getContractAt('IERC20', ALPHR_TOKEN)) as IERC20;
    const alphrHolderAddress = '0x6d16749cefb3892a101631279a8fe7369a281d0e';
    await network.provider.send('hardhat_impersonateAccount', [
      alphrHolderAddress,
    ]);
    const alphrHolder = await ethers.provider.getSigner(alphrHolderAddress);
    await (
      await user.sendTransaction({
        from: user.address,
        to: alphrHolderAddress,
        value: utils.parseEther('10'),
      })
    ).wait();

    await (
      await alphr
        .connect(alphrHolder)
        .transfer(user.address, utils.parseEther('10'))
    ).wait();
    await (
      await alphr
        .connect(user)
        .approve(nonFungibleManager.address, utils.parseEther('1000'))
    ).wait();
  });

  before('get weth token', async () => {
    weth = (await ethers.getContractAt('IERC20', WETH9)) as IERC20;
    const wethHolderAddress = '0xaae0633e15200bc9c50d45cd762477d268e126bd';
    await network.provider.send('hardhat_impersonateAccount', [
      wethHolderAddress,
    ]);
    const wethHolder = await ethers.provider.getSigner(wethHolderAddress);
    await (
      await user.sendTransaction({
        from: user.address,
        to: wethHolderAddress,
        value: utils.parseEther('10'),
      })
    ).wait();
    await (
      await weth
        .connect(wethHolder)
        .transfer(user.address, utils.parseEther('10'))
    ).wait();

    await (
      await weth.connect(user).approve(nonFungibleManager.address, MaxUint128)
    ).wait();
  });

  before('mint token for user', async () => {
    tx = await nonFungibleManager.connect(user).mint(
      {
        token0: ALPHR_TOKEN,
        token1: WETH9,
        tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
        tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
        fee: FeeAmount.MEDIUM,
        recipient: user.address,
        amount0Desired: 100,
        amount1Desired: 200,
        amount0Min: 1,
        amount1Min: 1,
        deadline: utils.parseEther('1'),
      },
      { gasLimit: 12450000 }
    );
    txr = await tx.wait();
    _id = txr.events[4].args.tokenId.toString();
    console.log('mint after');
  });

  it('user now owned of token', async () => {
    expect(await nonFungibleManager.ownerOf(_id)).to.be.eq(user.address);
  });

  it('revert stake when token is not approved', async () => {
    await expect(rew.connect(user).stake(_id)).to.be.revertedWith(
      'Token should be approved before stake'
    );
  });

  it('emit stake event', async () => {
    await nonFungibleManager.connect(user).approve(rew.address, _id);
    let txLocal = await rew.connect(user).stake(_id);
    let txrLocal = txLocal.wait();
    const expectedEventName = rew.interface.events['NewStake(uint256)'].name;
    const actualEventName = (await txrLocal).events[2].event;
    expect(actualEventName).to.be.equal(expectedEventName);
  });

  it('rewards conatract is now owned the token id', async () => {
    expect(await nonFungibleManager.ownerOf(_id)).to.be.eq(rew.address);
  });

  it('reward is stored user tokenId', async () => {
    let actualTokens = await rew.connect(user).staked();
    expect(actualTokens.length).to.be.eq(1);
    expect(actualTokens.toString()).to.be.eq(_id);
  });
});
