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

describe('Reward :: test reward contract for mock tokens', () => {
  let deployer, user: SignerWithAddress;
  let rew: Rewards;
  let tx: ContractTransaction;
  let txr: ContractReceipt;
  let nonFungibleManager: INonfungiblePositionManager;
  let alphr;
  let weth;
  let _id: BigNumber;
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
  before('deploy rewards contract as proxy', async () => {
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
    _id = txr.events[5].args.tokenId.toString();
  });

  it('address of created pool is equal to computePoolAddress', async () => {
    const [tokenA, tokenB] = sortedTokens(alphr.address, weth.address);
    expect(await rew.getPoolAddress(tokenA, tokenB, 3000)).to.be.eq(
      expectedAddress
    );
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
    const expectedEventName =
      rew.interface.events['NewStake(uint256,address)'].name;
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

  it('revert when trying to stake token from another pool', async () => {
    const address = '0xE4D91516D19d0B9a6Ed7fAd28fbAC031928f1352';
    await network.provider.send('hardhat_impersonateAccount', [address]);
    const alphrPositionHolder_13251 = ethers.provider.getSigner(address);
    const positionID = 13251;
    await nonFungibleManager
      .connect(alphrPositionHolder_13251)
      .approve(rew.address, positionID);
    await expect(
      rew.connect(alphrPositionHolder_13251).stake(positionID)
    ).to.be.revertedWith('Token should be corresponded to current pool');
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
