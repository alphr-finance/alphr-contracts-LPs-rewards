import { LP_TEST_BOOTSTRAP } from './lps-bootstrap.names';
import { LP_DEPLOY } from './rewards/lp-rewards-deploy.names';
import { task } from 'hardhat/config';
import { utils } from 'ethers';

import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../constants/uniswaps';

import { sortedTokens } from '../shared/tokenSort';
import { FeeAmount } from '../shared/constants';
import { encodePriceSqrt } from '../shared/encodePriceSqrt';

export default task(LP_TEST_BOOTSTRAP.NAME, LP_TEST_BOOTSTRAP.DESC).setAction(
  async (args, hre) => {
    const user = await hre.ethers.getSigner(
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
    );
    const mockAlphrAddress = await hre.run('erc20mock:deploy', {
      name: 'MockALPHR',
      symbol: 'MALPHR',
      decimals: '18',
    });
    console.log('Deployed Mock ALPHR tokens: %s', mockAlphrAddress);

    await hre.run('erc20mock:mintTo', {
      address: mockAlphrAddress,
      amount: utils.parseEther('100').toString(),
      to: user.address,
    });

    const mockWethAddress = await hre.run('erc20mock:deploy', {
      name: 'MockWETH',
      symbol: 'MWETH',
      decimals: '18',
    });
    console.log('Deployed Mock WETH tokens: %s', mockWethAddress);

    await hre.run('erc20mock:mintTo', {
      address: mockWethAddress,
      amount: utils.parseEther('100').toString(),
      to: user.address,
    });

    const rewardsAddress = await hre.run(LP_DEPLOY.NAME, {
      fc: UNISWAP_V3_FACTORY,
      nft: UNISWAP_V3_NFT_POSITION_MANAGER,
      alphr: mockAlphrAddress,
      pool: ALPHR_UNISWAP_V3_POOL,
    });
    console.log('Deployed LPs rewards contract: %s', rewardsAddress);

    const mockAlphr = await hre.ethers.getContractAt(
      'ERC20Mock',
      mockAlphrAddress
    );
    const mockWeth = await hre.ethers.getContractAt(
      'ERC20Mock',
      mockWethAddress
    );
    await (
      await mockAlphr
        .connect(user)
        .approve(UNISWAP_V3_NFT_POSITION_MANAGER, utils.parseEther('100'))
    ).wait();
    await (
      await mockWeth
        .connect(user)
        .approve(UNISWAP_V3_NFT_POSITION_MANAGER, utils.parseEther('100'))
    ).wait();
    let tokens = sortedTokens(mockAlphrAddress, mockWethAddress);
    let nonFungibleManager = await hre.ethers.getContractAt(
      'INonfungiblePositionManager',
      UNISWAP_V3_NFT_POSITION_MANAGER
    );
    console.log(
      'Received INonfungiblePositionManager contract: %s',
      nonFungibleManager.address
    );

    await (
      await nonFungibleManager.createAndInitializePoolIfNecessary(
        tokens[0],
        tokens[1],
        FeeAmount.MEDIUM,
        encodePriceSqrt(1, 1)
      )
    ).wait();
    console.log(
      'Allowance for mockAlphr: ',
      (
        await mockAlphr.allowance(user.address, UNISWAP_V3_NFT_POSITION_MANAGER)
      ).toString()
    );
    console.log(
      'Allowance for mockWeth: ',
      (
        await mockWeth.allowance(user.address, UNISWAP_V3_NFT_POSITION_MANAGER)
      ).toString()
    );
    const tokenID = await hre.run('uni:mint', {
      token0: tokens[0],
      token1: tokens[1],
      low: FeeAmount.MEDIUM.toString(),
      up: FeeAmount.MEDIUM.toString(),
      fee: FeeAmount.MEDIUM.toString(),
      recipient: user.address,
      des0: '100',
      des1: '200',
      min0: '1',
      min1: '1',
      deadline: utils.parseEther('1').toString(),
    });

    console.log('Successfully mint token with Id:', tokenID);
  }
);
