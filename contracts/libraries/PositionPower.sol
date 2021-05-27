pragma solidity ^0.7.6;

import '@uniswap/v3-core/contracts/libraries/TickMath.sol';
import '@uniswap/v3-core/contracts/libraries/SqrtPriceMath.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';

library PositionPower {
  using SafeMath for uint256;

  function calculatePositionPower(
    address alphrToken,
    address wethToken,
    uint128 liquidity,
    int24 tickLower,
    int24 tickUpper,
    int24 avaragePoolTick
  ) internal view returns (uint256 positionPower) {
    (uint256 alphr, uint256 weth) =
      getAmountsFromPosition(liquidity, tickLower, tickUpper, avaragePoolTick);
    uint256 rateEthToAlphr =
      getQuoteAtTick(avaragePoolTick, 1**18, wethToken, alphrToken);
    uint256 rate = rateEthToAlphr.div(10**18);
    positionPower = weth.mul(rate);
    positionPower = positionPower.add(alphr);
  }

  function getQuoteAtTick(
    int24 tick,
    uint128 baseAmount,
    address baseToken,
    address quoteToken
  ) private view returns (uint256 quoteAmount) {
    uint160 sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);

    // Calculate quoteAmount with better precision if it doesn't overflow when multiplied by itself
    if (sqrtRatioX96 <= type(uint128).max) {
      uint256 ratioX192 = uint256(sqrtRatioX96) * sqrtRatioX96;
      quoteAmount = baseToken < quoteToken
        ? FullMath.mulDiv(ratioX192, baseAmount, 1 << 192)
        : FullMath.mulDiv(1 << 192, baseAmount, ratioX192);
    } else {
      uint256 ratioX128 = FullMath.mulDiv(sqrtRatioX96, sqrtRatioX96, 1 << 64);
      quoteAmount = baseToken < quoteToken
        ? FullMath.mulDiv(ratioX128, baseAmount, 1 << 128)
        : FullMath.mulDiv(1 << 128, baseAmount, ratioX128);
    }
  }

  function getAmountsFromPosition(
    uint128 liquidity,
    int24 tickLower,
    int24 tickUpper,
    int24 avaragePoolTick
  ) internal view returns (uint256 token0Amount, uint256 token1Amount) {
    token0Amount = PositionPower.token0Amount(
      liquidity,
      avaragePoolTick,
      tickLower,
      tickUpper
    );
    token1Amount = PositionPower.token1Amount(
      liquidity,
      avaragePoolTick,
      tickLower,
      tickUpper
    );
  }

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
