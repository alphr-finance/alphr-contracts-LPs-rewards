/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, upgrades, network } from 'hardhat';
import { utils } from 'ethers';
import { ContractTransaction, ContractReceipt } from 'ethers';
import { Rewards } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../../constants/uniswaps';

import { INonfungiblePositionManager } from '../../typechain';
import { ALPHR_TOKEN } from '../../constants/tokens';
import { FeeAmount, MaxUint128, TICK_SPACINGS } from '../../shared/constants';
import { getMinTick, getMaxTick } from '../../shared/ticks';
import { encodePriceSqrt } from '../../shared/encodePriceSqrt';
import { BigNumber } from 'ethers';
import { sortedTokens } from '../../shared/tokenSort';
import { computePoolAddress } from '../../shared/computePoolAddress';

describe('Reward :: test unstake method for mock tokens', () => {
  let deployer, user: SignerWithAddress;
  let rew: Rewards;
  let tx: ContractTransaction;
  let txr: ContractReceipt;
  let nonFungibleManager: INonfungiblePositionManager;
  let alphr;
  let weth;
  let _id: BigNumber[] = [
    utils.parseUnits('0'),
    utils.parseUnits('0'),
    utils.parseUnits('0'),
  ];
  let expectedAddress: string;
  before('init signers', async () => {
    [deployer, user] = await ethers.getSigners();
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

  before('compute pool address', async () => {
    const [token0, token1] = sortedTokens(alphr.address, weth.address);
    expectedAddress = computePoolAddress(
      UNISWAP_V3_FACTORY,
      [token0, token1],
      FeeAmount.MEDIUM
    );
  });
  before('deploy rewards contract', async () => {
    const Rewards = await ethers.getContractFactory('Rewards');
    rew = await upgrades.deployProxy(Rewards, [
      UNISWAP_V3_FACTORY,
      UNISWAP_V3_NFT_POSITION_MANAGER,
      ALPHR_TOKEN,
      expectedAddress,
    ]);
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

  before('mint token for user', async () => {
    const [tokenA, tokenB] = sortedTokens(alphr.address, weth.address);
    for (let i = 0; i < 3; i++) {
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
      txr = await tx.wait();
      _id[i] = txr.events[5].args.tokenId.toString();
    }
  });
  before('stake minted tokens', async () => {
    for (let i = 0; i < 3; i++) {
      await nonFungibleManager.connect(user).approve(rew.address, _id[i]);
      await (await rew.connect(user).stake(_id[i])).wait();
    }
  });

  it('returns array of 3 elements of staked tokens', async () => {
    let staked: string = _id[0].toString();
    for (let i = 1; i < 3; i++) {
      staked += ',' + _id[i];
    }
    expect((await rew.connect(user).staked()).toString()).eq(staked);
    expect((await rew.connect(user).staked()).length).eq(3);
  });

  it('revert when trying to unstake token from another pool', async () => {
    const address = '0xE4D91516D19d0B9a6Ed7fAd28fbAC031928f1352';
    await network.provider.send('hardhat_impersonateAccount', [address]);
    const alphrPositionHolder_13251 = ethers.provider.getSigner(address);
    const positionID = 13251;
    await expect(
      rew.connect(alphrPositionHolder_13251).unstake(positionID)
    ).to.be.revertedWith('Token is not staked');
  });

  it('revert when user is not the owner of the token', async () => {
    await expect(rew.connect(deployer).unstake(_id[0])).to.be.revertedWith(
      'User must own this token'
    );
  });

  it('emitted event NewUnstake', async () => {
    let txLocal = await rew.connect(user).unstake(_id[0]);
    let txrLocal = await txLocal.wait();
    const expectedEventName =
      rew.interface.events['NewUnstake(uint256,address)'].name;
    const actualEventName = (await txrLocal).events[2].event;
    expect(actualEventName).to.be.equal(expectedEventName);
  });

  it('returns array of 2 elements of staked tokens', async () => {
    let staked: string = _id[2].toString();
    for (let i = 1; i > 0; i--) {
      staked += ',' + _id[i];
    }
    expect((await rew.connect(user).staked()).toString()).to.be.eq(staked);
    expect((await rew.connect(user).staked()).length).eq(2);
  });

  it('revert when user trying to unstake already unstaked token', async () => {
    await expect(rew.connect(user).unstake(_id[0])).to.be.revertedWith(
      'User must own this token'
    );
  });

  it('array of positions is empty after all tokens were unstaked', async () => {
    await rew.connect(user).unstake(_id[1]);
    await rew.connect(user).unstake(_id[2]);
    expect((await rew.connect(user).staked()).toString()).to.be.eq('');
    expect((await rew.connect(user).staked()).length).eq(0);
  });

  it('user owns all unstaked tokens', async () => {
    for (let i = 1; i < 3; i++) {
      expect(await nonFungibleManager.ownerOf(_id[i])).to.be.eq(user.address);
    }
  });
});
