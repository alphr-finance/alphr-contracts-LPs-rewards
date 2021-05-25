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

describe('Roll up :: calculation of claimable reward amount for positions { roll-up.test.ts }', () => {
  let rewards: Rewards;
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

  before('set block reward', async () => {
    await rewards.setBlockReward(ethers.utils.parseUnits('1', 18));
  });

  let positions = [
    { pos: 13251, addr: '0xE4D91516D19d0B9a6Ed7fAd28fbAC031928f1352' },
    { pos: 10863, addr: '0x034c0A702131e6dcC8c9B76F085eFcDFB3a1aC0c' },
    { pos: 12524, addr: '0x034c0A702131e6dcC8c9B76F085eFcDFB3a1aC0c' },
  ];

  for (let i = 0; i < positions.length; i++) {
    let positionID = positions[i].pos;
    let address = positions[i].addr;
    it('stake position ' + positionID, async () => {
      await network.provider.send('hardhat_impersonateAccount', [address]);
      let alphrPositionHolder = ethers.provider.getSigner(address);

      await nftPositionManager
        .connect(alphrPositionHolder)
        .approve(rewards.address, positionID);
      await rewards.connect(alphrPositionHolder).stake(positionID);
    });
  }

  for (let i = 0; i < 2; i++) {
    it(
      '[' + i + '] mine 100 blocks to generate rewards per block',
      async () => {
        for (let i = 0; i <= 100; i++) {
          await network.provider.send('evm_mine');
        }
      }
    );

    it('[' + i + '] roll up', async () => {
      await rewards.rollUp();

      for (let i = 0; i < positions.length; i++) {
        let val = await rewards.getRolledUpPosition(positions[i].pos);
        console.log(ethers.utils.formatUnits(val.toString(), 18));
      }
    });
  }

  after('reset node fork', async () => ResetToBlock(12472213));
});
