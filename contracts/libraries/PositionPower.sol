pragma solidity ^0.7.6;

import '@uniswap/v3-core/contracts/libraries/TickMath.sol';
import '@uniswap/v3-core/contracts/libraries/SqrtPriceMath.sol';

library PositionPower {
  /**
   * @dev Get ALPHR amount for NFT
   */
  function token0Amount(
    uint128 positionLiquidity,
    int24 poolCurrentTick,
    int24 positionTickLower,
    int24 positionTickUpper
  ) internal view returns (uint256 amount) {
    if (poolCurrentTick < positionTickLower) {
      return
        SqrtPriceMath.getAmount0Delta(
          TickMath.getSqrtRatioAtTick(positionTickLower),
          TickMath.getSqrtRatioAtTick(positionTickUpper),
          positionLiquidity,
          false
        );
    } else if (poolCurrentTick < positionTickUpper) {
      return
        SqrtPriceMath.getAmount0Delta(
          TickMath.getSqrtRatioAtTick(poolCurrentTick),
          TickMath.getSqrtRatioAtTick(positionTickUpper),
          positionLiquidity,
          false
        );
    } else {
      return 0;
    }
  }

  /**
   * @dev Get ETH amount for NFT
   */
  function token1Amount(
    uint128 positionLiquidity,
    int24 poolCurrentTick,
    int24 positionTickLower,
    int24 positionTickUpper
  ) internal pure returns (uint256 amount) {
    if (poolCurrentTick < positionTickLower) {
      return 0;
    } else if (poolCurrentTick < positionTickUpper) {
      return
        SqrtPriceMath.getAmount1Delta(
          TickMath.getSqrtRatioAtTick(positionTickLower),
          TickMath.getSqrtRatioAtTick(poolCurrentTick),
          positionLiquidity,
          false
        );
    } else {
      return
        SqrtPriceMath.getAmount1Delta(
          TickMath.getSqrtRatioAtTick(positionTickLower),
          TickMath.getSqrtRatioAtTick(positionTickUpper),
          positionLiquidity,
          false
        );
    }
  }
}
