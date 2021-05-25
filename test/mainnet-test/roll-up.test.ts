//@ts-ignore
/* eslint-disable jest/valid-expect */

import { ethers, network } from 'hardhat';
import { INonfungiblePositionManager, Rewards } from '../../typechain';
import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../../constants/uniswaps';
import { ALPHR_TOKEN } from '../../constants/tokens';
import { ResetToBlock } from '../utils/reset-fork';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ContractReceipt, ContractTransaction, utils } from 'ethers';
import { FeeAmount, MaxUint128, TICK_SPACINGS } from '../../shared/constants';
import { sortedTokens } from '../../shared/tokenSort';
import { encodePriceSqrt } from '../../shared/encodePriceSqrt';
import { expect } from 'chai';
import { getMaxTick, getMinTick } from '../../shared/ticks';

describe('Roll up :: calculation of claimable reward amount for positions { roll-up.test.ts }', () => {
  let deployer, user: SignerWithAddress;
  let rew: Rewards;
  let tx: ContractTransaction;
  let txr: ContractReceipt;
  let nonFungibleManager: INonfungiblePositionManager;
  let alphr, weth;
  before('init signers', async () => {
    [deployer, user] = await ethers.getSigners();
  });

  before('deploy rewards contract', async () => {
    const Rewards = await ethers.getContractFactory('Rewards');
    rew = (await Rewards.connect(deployer).deploy(
      UNISWAP_V3_FACTORY,
      UNISWAP_V3_NFT_POSITION_MANAGER,
      ALPHR_TOKEN,
      ALPHR_UNISWAP_V3_POOL
    )) as Rewards;
    await rew.deployed();
  });

  before('get alphr token', async () => {
    const erc20Mock = await ethers.getContractFactory('ERC20Mock');
    alphr = await erc20Mock.connect(deployer).deploy('MockToken', 'MT', 18);
    await alphr.deployed();
    await (
      await alphr
        .connect(user)
        .mint(ethers.utils.parseUnits('100', await alphr.decimals()))
    ).wait();
    alphr.connect(user).approve(UNISWAP_V3_NFT_POSITION_MANAGER, MaxUint128);
    weth = await erc20Mock.connect(deployer).deploy('MockToken20', 'MT20', 18);
    await weth.deployed();
    await (
      await weth
        .connect(user)
        .mint(ethers.utils.parseUnits('100', await alphr.decimals()))
    ).wait();
    weth.connect(user).approve(UNISWAP_V3_NFT_POSITION_MANAGER, MaxUint128);
  });

  before('create nft manager', async () => {
    nonFungibleManager = (await ethers.getContractAt(
      'INonfungiblePositionManager',
      UNISWAP_V3_NFT_POSITION_MANAGER
    )) as INonfungiblePositionManager;

    const [token0, token1] = sortedTokens(alphr.address, weth.address);
    await nonFungibleManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      FeeAmount.MEDIUM,
      encodePriceSqrt(1, 1)
    );
  });

  let txs = [];
  let positions = [];
  before('mint token for user', async () => {
    const [tokenA, tokenB] = sortedTokens(alphr.address, weth.address);
    for (let i = 0; i < 10; i++) {
      tx = await nonFungibleManager.connect(user).mint(
        {
          token0: tokenA,
          token1: tokenB,
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
      txs.push(tx);

      txr = await tx.wait();
      let _id = txr.events[5].args.tokenId.toString();
      positions.push(_id);
      console.log(_id);
    }
  });

  before('set block reward', async () => {
    await rew.setBlockReward(ethers.utils.parseUnits('1', 18));
  });

  it('emit stake events', async () => {
    console.log('pos.len ', positions.length);
    for (let i = 0; i < positions.length; i++) {
      console.log(positions[i]);
      await nonFungibleManager.connect(user).approve(rew.address, positions[i]);
      let txLocal = await rew.connect(user).stake(positions[i]);
      let txrLocal = txLocal.wait();
      const expectedEventName =
        rew.interface.events['NewStake(uint256,address)'].name;
      const actualEventName = (await txrLocal).events[2].event;
      expect(actualEventName).to.be.equal(expectedEventName);
    }
  });

  for (let i = 0; i < 2; i++) {
    it(
      '[' + i + '] mine 100 blocks to generate rewards per block',
      async () => {
        await network.provider.send('evm_setAutomine', [false]);
        for (let i = 0; i <= 100; i++) {
          await network.provider.send('evm_mine');
        }
        await network.provider.send('evm_setAutomine', [true]);
      }
    );

    it('[' + i + '] roll up', async () => {
      await rew.rollUp();

      for (let i = 0; i < positions.length; i++) {
        let val = await rew.getRolledUpPosition(positions[i]);
        console.log(ethers.utils.formatUnits(val.toString(), 18));
      }
    });
  }

  after('reset node fork', async () => ResetToBlock(12472213));
});
