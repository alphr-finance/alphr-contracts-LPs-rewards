import { LP_TEST_BOOTSTRAP } from './lps-bootstrap.names';
import { LP_DEPLOY } from './rewards/lp-rewards-deploy.names';
import { task } from 'hardhat/config';

import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../constants/uniswaps';
export default task(LP_TEST_BOOTSTRAP.NAME, LP_TEST_BOOTSTRAP.DESC).setAction(
  async (args, hre) => {
    const mockAlphrAddress = await hre.run('erc20mock:deploy', {
      name: 'MockALPHR',
      symbol: 'MALPHR',
      decimals: '18',
    });
    console.log('Deployed Mock ALPHR tokens: %s', mockAlphrAddress);

    const mockWethAddress = await hre.run('erc20mock:deploy', {
      name: 'MockWETH',
      symbol: 'MWETH',
      decimals: '18',
    });
    console.log('Deployed Mock WETH tokens: %s', mockWethAddress);

    const rewardsAddress = await hre.run(LP_DEPLOY.NAME, {
      fc: UNISWAP_V3_FACTORY,
      nft: UNISWAP_V3_NFT_POSITION_MANAGER,
      alphr: mockAlphrAddress,
      pool: ALPHR_UNISWAP_V3_POOL,
    });
    console.log('Deployed LPs rewards contract: %s', rewardsAddress);
  }
);
