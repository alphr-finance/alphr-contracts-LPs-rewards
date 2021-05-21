import { LP_TEST_BOOTSTRAP } from './lp-bootstrap-names-test';
import { LP_DEPLOY } from './lp-deploy-names';
import { task } from 'hardhat/config';

import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_HANDLER,
} from './../../constants/uniswaps';
import { ALPHR_TOKEN } from './../../constants/tokens';

export default task(LP_TEST_BOOTSTRAP.NAME, LP_TEST_BOOTSTRAP.DESC).setAction(
  async (args, hre) => {
    await hre.run(LP_DEPLOY.NAME, {
      fc: UNISWAP_V3_FACTORY,
      nft: UNISWAP_V3_NFT_HANDLER,
      alphr: ALPHR_TOKEN,
    });
  }
);
