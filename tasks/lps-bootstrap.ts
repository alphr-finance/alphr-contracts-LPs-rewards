import { utils } from 'ethers';
import { LP_TEST_BOOTSTRAP } from './lps-bootstrap.names';
import { LP_DEPLOY } from './rewards/lp-rewards-deploy.names';
import { task } from 'hardhat/config';

import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../constants/uniswaps';
import { ALPHR_TOKEN } from '../constants/tokens';

export default task(LP_TEST_BOOTSTRAP.NAME, LP_TEST_BOOTSTRAP.DESC).setAction(
  async (args, hre) => {
    await hre.run(LP_DEPLOY.NAME, {
      fc: UNISWAP_V3_FACTORY,
      nft: UNISWAP_V3_NFT_POSITION_MANAGER,
      alphr: ALPHR_TOKEN,
      pool: ALPHR_UNISWAP_V3_POOL,
    });
    const tokenAddress1 = await hre.run('erc20mock:deploy', {
      name: 'Mock',
      symbol: 'MK',
      decimals: '18',
    });
    const tokenAddress2 = await hre.run('erc20mock:deploy', {
      name: 'Mock20',
      symbol: 'M20',
      decimals: '18',
    });
    console.log(tokenAddress1);
    console.log(tokenAddress2);
    await hre.run('erc20mock:mintTo', {
      address: tokenAddress1,
      amount: '100',
      to: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    });
    await hre.run('erc20mock:mintTo', {
      address: tokenAddress2,
      amount: '100',
      to: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    });

    await hre.run('uni:init-pool', {
      token0: tokenAddress2,
      token1: tokenAddress1,
      fee: '3000',
      sqrtprice: '100',
    });

    const ercToken1 = await hre.ethers.getContractAt(
      'ERC20Mock',
      tokenAddress1
    );
    const ercToken2 = await hre.ethers.getContractAt(
      'ERC20Mock',
      tokenAddress2
    );
    const user = await hre.ethers.getSigner(
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
    );

    await ercToken1
      .connect(user)
      .approve(UNISWAP_V3_NFT_POSITION_MANAGER, utils.parseEther('1000'));
    await ercToken2
      .connect(user)
      .approve(UNISWAP_V3_NFT_POSITION_MANAGER, utils.parseEther('1000'));

    await hre.run('uni:mint', {
      token0: tokenAddress2,
      token1: tokenAddress1,
      low: '3000',
      up: '3000',
      fee: '3000',
      recipient: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      des0: '100',
      des1: '200',
      min0: '1',
      min1: '1',
      deadline: utils.parseEther('1').toString(),
    });
  }
);
