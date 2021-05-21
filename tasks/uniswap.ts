/* eslint-disable jest/no-standalone-expect */
/* eslint-disable jest/valid-expect */
import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';
import { task } from 'hardhat/config';

import { ALPHR_TOKEN } from './../constants/tokens';
import { UNISWAP_V3_NFT_HANDLER } from './../constants/uniswaps';
import { TX_RECEIPT_OK } from './../constants/tx-status';

export const WETH9 = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

export const CreatePolTasl = task(
  'uni:nft-manager',
  'create and init pool'
).setAction(async (args, hre) => {
  const nftManager = await hre.ethers.getContractAt(
    'INonfungiblePositionManager',
    UNISWAP_V3_NFT_HANDLER
  );
  let tx = await nftManager.createAndInitializePoolIfNecessary(
    ALPHR_TOKEN,
    WETH9,
    BigNumber.from(3000), //FeeAmount Medium
    utils.parseEther('1000')
  );
  let txr = await tx.wait();
  expect(txr.status).to.be.eq(TX_RECEIPT_OK);
  console.log('Pool has been created successfully');
});
