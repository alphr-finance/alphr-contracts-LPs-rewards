import { Rewards } from '../../typechain';
import { ethers } from 'hardhat';
import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../../constants/uniswaps';
import { ALPHR_TOKEN } from '../../constants/tokens';

describe('LPs Rewards :: get claimable amount from user who has no staked positions', () => {
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
  it('does not revert', async () => {
    await rewards.getClaimableAmount();
  });
});
