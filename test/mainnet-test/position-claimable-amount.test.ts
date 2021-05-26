/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, upgrades, network } from 'hardhat';
import { INonfungiblePositionManager, Rewards } from '../../typechain';
import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../../constants/uniswaps';
import { expect } from 'chai';
import { ALPHR_TOKEN } from '../../constants/tokens';

describe('Position claimable amount :: test suite for calculation of claimable reward amount for position { position-claimable-amounts.test.ts }', () => {
  let rewards: Rewards;
  before('deploy LPs rewards farming contract', async () => {
    const Rewards = await ethers.getContractFactory('Rewards');
    rewards = await upgrades.deployProxy(Rewards, [
      UNISWAP_V3_FACTORY,
      UNISWAP_V3_NFT_POSITION_MANAGER,
      ALPHR_TOKEN,
      ALPHR_UNISWAP_V3_POOL,
    ]);
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

  before('set block reward', async () => {
    await rewards.setBlockReward(ethers.utils.parseUnits('1', 18));
  });

  before(
    'turn OFF automine ',
    async () => await network.provider.send('evm_setAutomine', [false])
  );

  let alphrPositionHolder_13251;
  it('stake 13251 positions', async () => {
    const address = '0xE4D91516D19d0B9a6Ed7fAd28fbAC031928f1352';
    await network.provider.send('hardhat_impersonateAccount', [address]);
    alphrPositionHolder_13251 = ethers.provider.getSigner(address);

    const positionID = 13251;
    await nftPositionManager
      .connect(alphrPositionHolder_13251)
      .approve(rewards.address, positionID);
    await rewards.connect(alphrPositionHolder_13251).stake(positionID);
  });

  let alphrPositionHolder_10863;
  it('stake 10863 positions', async () => {
    const address = '0x034c0a702131e6dcc8c9b76f085efcdfb3a1ac0c';
    await network.provider.send('hardhat_impersonateAccount', [address]);
    alphrPositionHolder_10863 = ethers.provider.getSigner(address);

    const positionID = 10863;
    await nftPositionManager
      .connect(alphrPositionHolder_10863)
      .approve(rewards.address, positionID);
    await rewards.connect(alphrPositionHolder_10863).stake(positionID);
  });

  let alphrPositionHolder_12524;
  it('stake 12524 positions', async () => {
    const address = '0x034c0A702131e6dcC8c9B76F085eFcDFB3a1aC0c';
    await network.provider.send('hardhat_impersonateAccount', [address]);
    alphrPositionHolder_12524 = ethers.provider.getSigner(address);

    const positionID = 12524;
    await nftPositionManager
      .connect(alphrPositionHolder_12524)
      .approve(rewards.address, positionID);
    await rewards.connect(alphrPositionHolder_12524).stake(positionID);
  });

  it('mine one block to confirm mempool', async () =>
    await network.provider.send('evm_mine'));

  it('mine 100 blocks to generate rewards per block', async () => {
    let blockNumber = await ethers.provider.getBlockNumber();
    for (let i = 0; i < 100; i++) {
      await network.provider.send('evm_mine');
    }
    let currentBlockNumber = await ethers.provider.getBlockNumber();
    expect(currentBlockNumber - blockNumber).to.be.eq(100);
  });

  it('calculates correct claimable amount for 13251 staked position', async () => {
    // eslint-disable-next-line jest/valid-expect-in-promise
    await rewards
      .connect(alphrPositionHolder_13251)
      .getClaimableAmount()
      .then((amountInt) => ethers.utils.formatUnits(amountInt.toString(), 18))
      .then((amount) => expect(amount).to.be.eq('19.120942474327764829'));
  });

  it('calculates correct claimable amount for 10863 staked position', async () => {
    // eslint-disable-next-line jest/valid-expect-in-promise
    await rewards
      .connect(alphrPositionHolder_10863)
      .getClaimableAmount()
      .then((amountInt) => ethers.utils.formatUnits(amountInt.toString(), 18))
      .then((amount) => expect(amount).to.be.eq('80.87905752567223517'));
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
