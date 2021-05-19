//@ts-ignore
import { ethers, network } from 'hardhat';
import { utils } from 'ethers';
//import { ContractTransaction } from 'ethers';
import { Rewards } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
//import { expect } from 'chai';
import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_HANDLER,
} from '../../constants/uniswaps';

import { INonfungiblePositionManager } from '../../typechain/INonfungiblePositionManager';
import { ALPHR_TOKEN, WETH9 } from '../../constants/tokens';
import { FeeAmount, MaxUint128 /*TICK_SPACINGS*/ } from '../shared/constants';
//import { getMinTick, getMaxTick } from '../shared/ticks';
import { encodePriceSqrt } from '../shared/encodePriceSqrt';
import { IERC20 } from '../../typechain/IERC20';

describe('Reward :: test reward contract', () => {
  let deployer, user: SignerWithAddress;
  let rew: Rewards;
  //  let tx: ContractTransaction;
  let nonFungibleManager: INonfungiblePositionManager;
  let alphr, weth: IERC20;
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
    console.log((await nonFungibleManager.address).toString());
    await (
      await nonFungibleManager.createAndInitializePoolIfNecessary(
        WETH9,
        ALPHR_TOKEN,
        FeeAmount.MEDIUM,
        encodePriceSqrt(1, 1)
      )
    ).wait();
  });

  before('get alphr token', async () => {
    alphr = (await ethers.getContractAt('IERC20', ALPHR_TOKEN)) as IERC20;
    const alphrHolderAddress = '0xdffbf625624fe63478c147797892d6218f550c3d';
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
    await alphr
      .connect(alphrHolder)
      .transfer(user.address, utils.parseEther('10'));
    await alphr
      .connect(alphrHolder)
      .transfer(nonFungibleManager.address, utils.parseEther('10'));
    await alphr.approve(nonFungibleManager.address, MaxUint128);
    await alphr.connect(user).approve(nonFungibleManager.address, MaxUint128);
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
    await weth
      .connect(wethHolder)
      .transfer(user.address, utils.parseEther('10'));
    await weth.approve(nonFungibleManager.address, MaxUint128);
    await weth
      .connect(wethHolder)
      .transfer(nonFungibleManager.address, utils.parseEther('10'));
    await weth.connect(user).approve(nonFungibleManager.address, MaxUint128);
  });

  // it('test mint method', async () => {
  //   let n = 1621423479 + 100000
  //   let txr = nonFungibleManager.mint({
  //     token0: WETH9,
  //     token1: ALPHR_TOKEN,
  //     tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
  //     tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
  //     fee: FeeAmount.MEDIUM,
  //     recipient: user.address,
  //     amount0Desired: 15,
  //     amount1Desired: 15,
  //     amount0Min: 0,
  //     amount1Min: 0,
  //     deadline: n,
  //   });
  // });
});
