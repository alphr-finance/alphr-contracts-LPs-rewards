// FOR TEST
/*
npx hardhat--network localhost  uni:init-pool 
    --token0 0xaa99199d1e9644b588796f3215089878440d58e0 
    --token1 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 
    --fee 3000 
    --sqrtprice 1000 
token0 -> ALPHR token
token1 -> WETH9
*/
/* eslint-disable jest/no-standalone-expect */
/* eslint-disable jest/valid-expect */
import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';
import { task } from 'hardhat/config';
import { UNISWAP_V3_NFT_HANDLER } from './../../constants/uniswaps';
import { TX_RECEIPT_OK } from './../../constants/tx-status';
import { UNISWAP } from './uniswap-names';

export const CreatePolTasl = task('uni:init-pool', 'create and init pool')
  .addParam(UNISWAP.TOKEN0_ADDRESS, UNISWAP.TOKEN0_ADDRESS_DESC)
  .addParam(UNISWAP.TOKEN1_ADDRESS, UNISWAP.TOKEN1_ADDRESS_DESC)
  .addParam(UNISWAP.FEE_AMOUNT, UNISWAP.FEE_AMOUNT_DESC)
  .addParam(UNISWAP.SQRT_PRICE, UNISWAP.SQRT_PRICE_DESC)
  .setAction(async ({ token0, token1, fee, sqrtprice }, hre) => {
    const nftManager = await hre.ethers.getContractAt(
      'INonfungiblePositionManager',
      UNISWAP_V3_NFT_HANDLER
    );
    let tx = await nftManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      BigNumber.from(fee),
      utils.parseEther(sqrtprice)
    );
    let txr = await tx.wait();
    expect(txr.status).to.be.eq(TX_RECEIPT_OK);
    console.log('Pool has been created successfully');
  });
