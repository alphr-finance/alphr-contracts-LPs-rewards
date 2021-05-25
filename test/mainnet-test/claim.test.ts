//@ts-ignore
/* eslint-disable jest/valid-expect */

import { ethers, network } from 'hardhat';
import { utils } from 'ethers';
import { INonfungiblePositionManager, Rewards, IERC20 } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../../constants/uniswaps';
import { expect } from 'chai';
import { ALPHR_TOKEN } from '../../constants/tokens';

const alphrDecimals = 18;
const alphrHolderAddress = '0xd266d61ac22c2a2ac2dd832e79c14ea152c998d6';

describe('LP Rewards :: claim test suite { claim.test.ts }', () => {
  let rewards: Rewards;
  let deployer: SignerWithAddress;
  let alphr: IERC20;

  before('init signers', async () => {
    [deployer] = await ethers.getSigners();
  });

  before('deploy LPs rewards farming contract', async () => {
    rewards = await ethers
      .getContractFactory('Rewards')
      .then((factory) =>
        factory.deploy(
          UNISWAP_V3_FACTORY,
          UNISWAP_V3_NFT_POSITION_MANAGER,
          ALPHR_TOKEN,
          ALPHR_UNISWAP_V3_POOL
        )
      )
      .then((contract) => contract as Rewards);
  });

  let nftPositionManager: INonfungiblePositionManager;
  before('deploy rewards contract', async () => {
    nftPositionManager = await ethers
      .getContractAt(
        'INonfungiblePositionManager',
        UNISWAP_V3_NFT_POSITION_MANAGER
      )
      .then((contract) => contract as INonfungiblePositionManager);
  });

  before('send 1000 ALPHR to rewards contract', async () => {
    alphr = (await ethers.getContractAt('IERC20', ALPHR_TOKEN)) as IERC20;

    await network.provider.send('hardhat_impersonateAccount', [
      alphrHolderAddress,
    ]);
    const alphrHolder = await ethers.provider.getSigner(alphrHolderAddress);

    // send eth to pay tx
    await deployer.sendTransaction({
      to: alphrHolderAddress,
      value: utils.parseEther('1000'),
    });

    await alphr
      .connect(alphrHolder)
      .transfer(rewards.address, utils.parseUnits('1000', alphrDecimals));
  });

  before('set block reward', async () => {
    await rewards.setBlockReward(ethers.utils.parseUnits('1', 18));
  });

  let alphrPositionHolder_13251: SignerWithAddress;
  it('stake 13251 positions', async () => {
    const address = '0xE4D91516D19d0B9a6Ed7fAd28fbAC031928f1352';
    await network.provider.send('hardhat_impersonateAccount', [address]);
    alphrPositionHolder_13251 = await ethers.getSigner(address);

    const positionID = 13251;
    await nftPositionManager
      .connect(alphrPositionHolder_13251)
      .approve(rewards.address, positionID);
    await rewards.connect(alphrPositionHolder_13251).stake(positionID);
  });

  it('mine one block to confirm mempool', async () =>
    await network.provider.send('evm_mine'));

  it('mine first 100 blocks to generate rewards per block', async () => {
    let blockNumber = await ethers.provider.getBlockNumber();
    for (let i = 0; i < 100; i++) {
      await network.provider.send('evm_mine');
    }
    let currentBlockNumber = await ethers.provider.getBlockNumber();
    expect(currentBlockNumber - blockNumber).to.be.eq(100);
  });

  it('calculates correct claimable amount after 100 mined blocks', async () => {
    // eslint-disable-next-line jest/valid-expect-in-promise
    await rewards
      .connect(alphrPositionHolder_13251)
      .getClaimableAmount()
      .then((amountInt) =>
        console.log(ethers.utils.formatUnits(amountInt.toString(), 18))
      );
  });

  it('mine second 100 blocks to generate rewards per block', async () => {
    let blockNumber = await ethers.provider.getBlockNumber();
    for (let i = 0; i < 100; i++) {
      await network.provider.send('evm_mine');
    }
    let currentBlockNumber = await ethers.provider.getBlockNumber();
    expect(currentBlockNumber - blockNumber).to.be.eq(100);
  });

  it('calculates correct claimable amount after 200 mined blocks', async () => {
    // eslint-disable-next-line jest/valid-expect-in-promise
    await rewards
      .connect(alphrPositionHolder_13251)
      .getClaimableAmount()
      .then((amountInt) =>
        console.log(ethers.utils.formatUnits(amountInt.toString(), 18))
      );
  });

  it('claim for alphrPositionHolder_13251 and then check if the claimable amount is 0', async () => {
    // eslint-disable-next-line jest/valid-expect-in-promise

    let balanceBefore = await alphr.balanceOf(
      alphrPositionHolder_13251.address
    );
    console.log('Before Claim:\t', ethers.utils.formatUnits(balanceBefore, 18));

    await rewards.connect(alphrPositionHolder_13251).claim();

    let balanceAfter = await alphr.balanceOf(alphrPositionHolder_13251.address);
    console.log('After Claim:\t', ethers.utils.formatUnits(balanceAfter, 18));

    let claimableAmount = await rewards
      .connect(alphrPositionHolder_13251)
      .getClaimableAmount();
    expect(claimableAmount).to.be.eq(0);
  });

  after('reset node fork', async () => {
    await network.provider.send('evm_setAutomine', [true]);
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
