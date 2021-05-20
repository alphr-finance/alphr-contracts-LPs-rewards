pragma solidity =0.7.5;
pragma abicoder v2;

import '@uniswap/v3-core/contracts/libraries/TickMath.sol';
import '@uniswap/v3-core/contracts/libraries/SqrtPriceMath.sol';

library PositionLib {
  struct PositionData {
    uint128 positionLiquidity;
    int24 poolCurrentTick;
    int24 positionTickLower;
    int24 positionTickUpper;
  }

  /**
   * @dev Get ALPHR amount for NFT
   */
  function token0Amount(PositionData calldata pos)
    internal
    pure
    returns (uint256 amount)
  {
    if (pos.poolCurrentTick < pos.positionTickLower) {
      return
        SqrtPriceMath.getAmount0Delta(
          TickMath.getSqrtRatioAtTick(pos.positionTickLower),
          TickMath.getSqrtRatioAtTick(pos.positionTickUpper),
          pos.positionLiquidity,
          false
        );
    } else if (pos.poolCurrentTick < pos.positionTickUpper) {
      return
        SqrtPriceMath.getAmount0Delta(
          TickMath.getSqrtRatioAtTick(pos.poolCurrentTick),
          TickMath.getSqrtRatioAtTick(pos.positionTickUpper),
          pos.positionLiquidity,
          false
        );
    } else {
      return 0;
    }
  }

  /**
   * @dev Get ETH amount for NFT
   */
  function token1Amount(PositionData calldata pos)
    internal
    pure
    returns (uint256 amount)
  {
    if (pos.poolCurrentTick < pos.positionTickLower) {
      return 0;
    } else if (pos.poolCurrentTick < pos.positionTickUpper) {
      return
        SqrtPriceMath.getAmount1Delta(
          TickMath.getSqrtRatioAtTick(pos.positionTickLower),
          TickMath.getSqrtRatioAtTick(pos.poolCurrentTick),
          pos.positionLiquidity,
          false
        );
    } else {
      return
        SqrtPriceMath.getAmount1Delta(
          TickMath.getSqrtRatioAtTick(pos.positionTickLower),
          TickMath.getSqrtRatioAtTick(pos.positionTickUpper),
          pos.positionLiquidity,
          false
        );
    }
  }
}
