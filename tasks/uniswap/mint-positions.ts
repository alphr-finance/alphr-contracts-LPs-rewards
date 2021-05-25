/* eslint-disable jest/no-standalone-expect */
/* eslint-disable jest/valid-expect */
import { task } from 'hardhat/config';
import { UNISWAP_V3_NFT_POSITION_MANAGER } from './../../constants/uniswaps';
import { UNISWAP_MINT } from './mint-position.names';
import { TICK_SPACINGS } from '../../shared/constants';
import { getMinTick, getMaxTick } from '../../shared/ticks';

export const MintTask = task('uni:mint', 'mint tokens')
  .addParam(UNISWAP_MINT.TOKEN0_ADDRESS, UNISWAP_MINT.TOKEN0_ADDRESS_DESC)
  .addParam(UNISWAP_MINT.TOKEN1_ADDRESS, UNISWAP_MINT.TOKEN1_ADDRESS_DESC)
  .addParam(UNISWAP_MINT.TICK_LOWER, UNISWAP_MINT.TICK_LOWER_DESC)
  .addParam(UNISWAP_MINT.TICK_UPPER, UNISWAP_MINT.TICK_UPPER_DESC)
  .addParam(UNISWAP_MINT.FEE_AMOUNT, UNISWAP_MINT.FEE_AMOUNT_DESC)
  .addParam(UNISWAP_MINT.RECIPIENT, UNISWAP_MINT.RECIPIENT_DESC)
  .addParam(UNISWAP_MINT.AMOUNT0_DESIRED, UNISWAP_MINT.AMOUNT0_DESIRED_DESC)
  .addParam(UNISWAP_MINT.AMOUNT1_DESIRED, UNISWAP_MINT.AMOUNT1_DESIRED_DESC)
  .addParam(UNISWAP_MINT.AMOUNT0_MIN, UNISWAP_MINT.AMOUNT0_MIN_DESC)
  .addParam(UNISWAP_MINT.AMOUNT1_MIN, UNISWAP_MINT.AMOUNT1_MIN_DESC)
  .addParam(UNISWAP_MINT.DEADLINE, UNISWAP_MINT.DEADLINE_DESC)
  .setAction(
    async (
      {
        token0,
        token1,
        low,
        up,
        fee,
        recipient,
        des0,
        des1,
        min0,
        min1,
        deadline,
      },
      hre
    ) => {
      const nftManager = await hre.ethers.getContractAt(
        'INonfungiblePositionManager',
        UNISWAP_V3_NFT_POSITION_MANAGER
      );
      let tx = await nftManager.mint(
        {
          token0: token0,
          token1: token1,
          tickLower: getMinTick(TICK_SPACINGS[low]),
          tickUpper: getMaxTick(TICK_SPACINGS[up]),
          fee: fee,
          recipient: recipient,
          amount0Desired: des0,
          amount1Desired: des1,
          amount0Min: min0,
          amount1Min: min1,
          deadline: deadline,
        },
        { gasLimit: 12450000 }
      );
      let txr = await tx.wait();
      // console.log('Minted tokenId:', txr.events[5].args.tokenId.toString());

      return txr.events[5].args.tokenId.toString();
    }
  );
