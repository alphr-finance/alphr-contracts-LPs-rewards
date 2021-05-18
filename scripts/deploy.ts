// @ts-ignore
import { ethers } from 'hardhat';
import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_HANDLER,
} from '../constants/uniswaps';
import { ALPHR_TOKEN } from '../constants/tokens';

async function main() {
  const rewards = await ethers
    .getContractFactory('Rewards')
    .then((deployFactory) =>
      deployFactory.deploy(
        UNISWAP_V3_FACTORY,
        UNISWAP_V3_NFT_HANDLER,
        ALPHR_TOKEN
      )
    );
  console.log('Rewards contract deployed: %s', rewards.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
