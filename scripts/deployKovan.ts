// @ts-ignore
import { ethers, upgrades } from 'hardhat';
import {
  KOVAN_ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../constants/uniswaps';
import { KOVAN_ALPHR_TOKEN } from '../constants/tokens';

async function main() {
  const Rewards = await ethers.getContractFactory('Rewards');
  const rewards = await upgrades.deployProxy(Rewards, [
    UNISWAP_V3_FACTORY,
    UNISWAP_V3_NFT_POSITION_MANAGER,
    KOVAN_ALPHR_TOKEN,
    KOVAN_ALPHR_UNISWAP_V3_POOL,
  ]);
  console.log('Rewards contract deployed: %s', rewards.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
