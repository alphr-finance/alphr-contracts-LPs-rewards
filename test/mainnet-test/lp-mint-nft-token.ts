//@ts-ignore
import { ethers, network } from 'hardhat';
import { utils } from 'ethers';
import { ContractTransaction } from 'ethers';
import { Rewards } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
//import { expect } from 'chai';
import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_HANDLER,
} from '../../constants/uniswaps';
//import { TX_RECEIPT_OK } from '../../constants/tx-status';
import { INonfungiblePositionManager } from '../../typechain/INonfungiblePositionManager';
import { ALPHR_TOKEN, WETH9 } from '../../constants/tokens';
import { FeeAmount, MaxUint128, TICK_SPACINGS } from '../shared/constants';
import { getMinTick, getMaxTick } from '../shared/ticks';
import { encodePriceSqrt } from '../shared/encodePriceSqrt';
import { IERC20 } from '../../typechain/IERC20';

describe('Reward :: test reward contract', () => {
  let deployer, user: SignerWithAddress;
  let rew: Rewards;
  let tx: ContractTransaction;
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
    await nonFungibleManager.createAndInitializePoolIfNecessary(
      WETH9,
      ALPHR_TOKEN,
      FeeAmount.MEDIUM,
      encodePriceSqrt(1, 1)
    );
  });
  before('get alphr token', async () => {
    alphr = (await ethers.getContractAt('IERC20', ALPHR_TOKEN)) as IERC20;
    const alphrHolderAddress = '0xdffbf625624fe63478c147797892d6218f550c3d';
    await network.provider.send('hardhat_impersonateAccount', [
      alphrHolderAddress,
    ]);
    // const alphrHolder = await ethers.provider.getSigner(alphrHolderAddress)

    await alphr.approve(nonFungibleManager.address, MaxUint128);
    await alphr.connect(user).approve(nonFungibleManager.address, MaxUint128);
  });
  before('get weth token', async () => {
    weth = (await ethers.getContractAt('IERC20', WETH9)) as IERC20;
    const wethHolderAddress = '0x0f4e2a456aafc0068a0718e3107b88d2e8f2bfef';
    await network.provider.send('hardhat_impersonateAccount', [
      wethHolderAddress,
    ]);
    //const wethHolder = await ethers.provider.getSigner(wethHolderAddress)

    await weth.approve(nonFungibleManager.address, MaxUint128);
    await weth.connect(user).approve(nonFungibleManager.address, MaxUint128);
  });

  it('test mint method', async () => {
    tx = await nonFungibleManager.mint({
      token0: WETH9,
      token1: ALPHR_TOKEN,
      tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
      tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
      fee: FeeAmount.MEDIUM,
      recipient: user.address,
      amount0Desired: 100,
      amount1Desired: 100,
      amount0Min: 0,
      amount1Min: 0,
      deadline: utils.parseEther('100'),
    });
    let txr = await tx.wait();
    console.log(txr);
  });
});
