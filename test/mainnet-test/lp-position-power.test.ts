/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, upgrades } from 'hardhat';
import { Rewards } from '../../typechain';
import { expect } from 'chai';

import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../../constants/uniswaps';
import { ALPHR_TOKEN } from '../../constants/tokens';

describe('Position claimable amount :: test suite for calculation of claimable reward amount for position { position-claimable-amounts.test.ts }', () => {
  let rewards: Rewards;
  before('deploy rewards contract', async () => {
    const Rewards = await ethers.getContractFactory('Rewards');
    rewards = await upgrades.deployProxy(Rewards, [
      UNISWAP_V3_FACTORY,
      UNISWAP_V3_NFT_POSITION_MANAGER,
      ALPHR_TOKEN,
      ALPHR_UNISWAP_V3_POOL,
    ]);
  });

  //tested for block 12523571
  it('calculates correct claimable amount for 10863 staked position', async () => {
    await rewards
      .calculatePositionPower('414410231101918657572', '-128100', '0', '-65493')
      .then((positionPower) =>
        expect(positionPower).to.be.eq('21012284013790000603964')
      );
  });
});
