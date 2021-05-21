/* eslint-disable jest/no-standalone-expect */
/* eslint-disable jest/valid-expect */
import { task } from 'hardhat/config';
import { UNISWAP_V3_NFT_POSITION_MANAGER } from './../../constants/uniswaps';
import { UNISWAP } from './uniswap-names';
import { TICK_SPACINGS } from './../../test/shared/constants';
import { getMinTick, getMaxTick } from './../../test/shared/ticks';

export const MintTask = task('uni:mint', 'mint tokens')
  .addParam(UNISWAP.FROM, UNISWAP.FROM_DESC)
  .addParam(UNISWAP.TOKEN0_ADDRESS, UNISWAP.TOKEN0_ADDRESS_DESC)
  .addParam(UNISWAP.TOKEN1_ADDRESS, UNISWAP.TOKEN1_ADDRESS_DESC)
  .addParam(UNISWAP.TICK_LOWER, UNISWAP.TICK_LOWER_DESC)
  .addParam(UNISWAP.TICK_UPPER, UNISWAP.TICK_UPPER_DESC)
  .addParam(UNISWAP.FEE_AMOUNT, UNISWAP.FEE_AMOUNT_DESC)
  .addParam(UNISWAP.RECIPIENT, UNISWAP.RECIPIENT_DESC)
  .addParam(UNISWAP.AMOUNT0_DESIRED, UNISWAP.AMOUNT0_DESIRED_DESC)
  .addParam(UNISWAP.AMOUNT1_DESIRED, UNISWAP.AMOUNT1_DESIRED_DESC)
  .addParam(UNISWAP.AMOUNT0_MIN, UNISWAP.AMOUNT0_MIN_DESC)
  .addParam(UNISWAP.AMOUNT1_MIN, UNISWAP.AMOUNT1_MIN_DESC)
  .addParam(UNISWAP.DEADLINE, UNISWAP.DEADLINE_DESC)
  .setAction(
    async (
      {
        from,
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
      let tx = await nftManager.connect(from).mint(
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
      console.log('Minted tokenId:', txr.events[4].args.tokenId);
    }
  );
