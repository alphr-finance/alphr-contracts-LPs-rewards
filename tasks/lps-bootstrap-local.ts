import { LP_TEST_BOOTSTRAP } from './lps-bootstrap-local.names';
import { LP_DEPLOY } from './rewards/lp-rewards-deploy.names';
import { task, types } from 'hardhat/config';
import { utils } from 'ethers';

import {
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../constants/uniswaps';

import { sortedTokens } from '../shared/tokenSort';
import { FeeAmount } from '../shared/constants';
import { encodePriceSqrt } from '../shared/encodePriceSqrt';
import { computePoolAddress } from '../shared/computePoolAddress';
import { LP_STAKE } from './rewards/lp-stake.names';

export default task(LP_TEST_BOOTSTRAP.NAME, LP_TEST_BOOTSTRAP.DESC)
  .addOptionalParam(
    LP_TEST_BOOTSTRAP.GANACHE,
    LP_TEST_BOOTSTRAP.GANACHE_DESC,
    false,
    types.boolean
  )
  .setAction(async ({ ganache }, hre) => {
    const [user, dev] = await hre.ethers.getSigners();
    const mockAlphrAddress = await hre.run('erc20mock:deploy', {
      name: 'MockALPHR',
      symbol: 'MALPHR',
      decimals: '18',
    });
    console.log('Deployed Mock ALPHR tokens: %s', mockAlphrAddress);

    await hre.run('erc20mock:mintTo', {
      address: mockAlphrAddress,
      amount: '100',
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
      amount: '100',
      to: user.address,
    });

    const mockAlphr = await hre.ethers.getContractAt(
      'ERC20Mock',
      mockAlphrAddress
    );
    const mockWeth = await hre.ethers.getContractAt(
      'ERC20Mock',
      mockWethAddress
    );
    await mockAlphr
      .connect(user)
      .approve(UNISWAP_V3_NFT_POSITION_MANAGER, utils.parseEther('100'))
      .then((tx) => tx.wait());

    await mockWeth
      .connect(user)
      .approve(UNISWAP_V3_NFT_POSITION_MANAGER, utils.parseEther('100'))
      .then((tx) => tx.wait());

    let tokens = sortedTokens(mockAlphrAddress, mockWethAddress);
    let nonFungibleManager = await hre.ethers.getContractAt(
      'INonfungiblePositionManager',
      UNISWAP_V3_NFT_POSITION_MANAGER
    );
    console.log(
      'Received INonfungiblePositionManager contract: %s',
      nonFungibleManager.address
    );

    await nonFungibleManager
      .createAndInitializePoolIfNecessary(
        tokens[0],
        tokens[1],
        FeeAmount.MEDIUM,
        encodePriceSqrt(1, 1)
      )
      .then((tx) => tx.wait());

    const poolAddress = computePoolAddress(
      UNISWAP_V3_FACTORY,
      [tokens[0], tokens[1]],
      FeeAmount.MEDIUM
    );

    console.log('Created UNI v3 pool:\t%s', poolAddress);

    const rewardsAddress = await hre.run(LP_DEPLOY.NAME, {
      fc: UNISWAP_V3_FACTORY,
      nft: UNISWAP_V3_NFT_POSITION_MANAGER,
      alphr: mockAlphrAddress,
      pool: poolAddress,
    });
    console.log('Deployed LPs rewards contract: %s', rewardsAddress);

    await mockAlphr
      .allowance(user.address, UNISWAP_V3_NFT_POSITION_MANAGER)
      .then((allowance) =>
        console.log(
          'Allowance from user to UNI V3 NFT:\t%s',
          utils.formatUnits(allowance.toString(), 18).toString()
        )
      );

    await mockWeth
      .allowance(user.address, UNISWAP_V3_NFT_POSITION_MANAGER)
      .then((allowance) =>
        console.log(
          'Allowance from user to UNI V3 NFT:\t%s',
          utils.formatUnits(allowance.toString(), 18).toString()
        )
      );

    const positionsIDs = [];
    for (let i = 0; i < 10; i++) {
      const positionID = await hre.run('uni:mint', {
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
      positionsIDs.push(positionID);
      console.log('Successfully mint token with Id:', positionID);
      await nonFungibleManager
        .connect(user)
        .transferFrom(user.address, dev.address, positionID);
    }

    // stake some tokens

    for (let i = 0; i < 3; i++) {
      // approve first

      await hre.run(LP_STAKE.NAME, {
        from: dev.address,
        rew: rewardsAddress,
        tokenId: positionsIDs[i],
        nft: nonFungibleManager.address,
      });
      // const position = positionsIDs[i];
      // await nonFungibleManager.connect(dev).approve(rewardsAddress, position);
      // const rewards = await hre.ethers.getContractAt('Rewards', rewardsAddress);
      // await rewards.connect(dev).stake(position);
      // console.log('Staked token: %s', position);
    }

    if (!ganache) {
      await hre.network.provider.send('evm_setIntervalMining', [5000]);
    }
  });
