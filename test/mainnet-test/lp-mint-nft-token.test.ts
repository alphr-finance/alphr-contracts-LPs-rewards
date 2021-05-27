/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, upgrades, network } from 'hardhat';
import { utils } from 'ethers';
import { ContractTransaction, ContractReceipt } from 'ethers';
import { Rewards } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../../constants/uniswaps';

import { INonfungiblePositionManager } from '../../typechain';
import { ALPHR_TOKEN, WETH9 } from '../../constants/tokens';
import { FeeAmount, MaxUint128, TICK_SPACINGS } from '../../shared/constants';
import { getMinTick, getMaxTick } from '../../shared/ticks';
import { encodePriceSqrt } from '../../shared/encodePriceSqrt';
import { IERC20 } from '../../typechain';
import { BigNumber } from 'ethers';

describe('Reward :: test reward contract', () => {
  let deployer, user: SignerWithAddress;
  let rewards: Rewards;
  let tx: ContractTransaction;
  let txr: ContractReceipt;
  let nonFungibleManager: INonfungiblePositionManager;
  let alphr, weth: IERC20;
  let _id: BigNumber;
  before('init signers', async () => {
    [deployer, user] = await ethers.getSigners();
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
            ALPHR_TOKEN,
            ALPHR_UNISWAP_V3_POOL,
          ])
        )
        .then((rewardsContract) => rewardsContract.deployed())
        .then((rewardsDeployedContract) => rewardsDeployedContract as Rewards))
  );

  before('create nft manager', async () => {
    nonFungibleManager = (await ethers.getContractAt(
      'INonfungiblePositionManager',
      UNISWAP_V3_NFT_POSITION_MANAGER
    )) as INonfungiblePositionManager;

    await nonFungibleManager
      .createAndInitializePoolIfNecessary(
        ALPHR_TOKEN,
        WETH9,
        FeeAmount.MEDIUM,
        encodePriceSqrt(1, 1)
      )
      .then((tx) => tx.wait());
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
  });

  it('user now owned of token', async () => {
    expect(await nonFungibleManager.ownerOf(_id)).to.be.eq(user.address);
  });

  it('revert stake when token is not approved', async () => {
    await expect(rewards.connect(user).stake(_id)).to.be.revertedWith(
      'Token should be approved before stake'
    );
  });

  it('emit stake event', async () => {
    await nonFungibleManager.connect(user).approve(rewards.address, _id);
    let txLocal = await rewards.connect(user).stake(_id);
    let txrLocal = txLocal.wait();
    const expectedEventName =
      rewards.interface.events['NewStake(uint256,address)'].name;
    const actualEventName = (await txrLocal).events[2].event;
    expect(actualEventName).to.be.equal(expectedEventName);
  });

  it('rewards conatract is now owned the token id', async () => {
    expect(await nonFungibleManager.ownerOf(_id)).to.be.eq(rewards.address);
  });

  it('reward is stored user tokenId', async () => {
    let actualTokens = await rewards.connect(user).staked();
    expect(actualTokens.length).to.be.eq(1);
    expect(actualTokens.toString()).to.be.eq(_id);
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
