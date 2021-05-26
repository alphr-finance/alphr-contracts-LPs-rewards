//@ts-ignore
import { ethers, upgrades } from 'hardhat';
import { Rewards } from '../../typechain';
import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../../constants/uniswaps';
import { ALPHR_TOKEN } from '../../constants/tokens';

describe('LPs Rewards :: get claimable amount from user who has no staked positions', () => {
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
  it('does not revert', async () => {
    await rewards.getClaimableAmount();
  });
});
