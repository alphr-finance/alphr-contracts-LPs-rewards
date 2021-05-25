pragma solidity =0.7.6;

import './interfaces/IRewards.sol';

import {
  IUniswapV3Factory
} from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol';
import {
  IUniswapV3Pool
} from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import {
  IUniswapV3PoolState
} from '@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolState.sol';
import {
  INonfungiblePositionManager
} from '@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol';
import {
  INonfungibleTokenPositionDescriptor
} from '@uniswap/v3-periphery/contracts/interfaces/INonfungibleTokenPositionDescriptor.sol';
import {
  IERC721Enumerable
} from '@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {
  IUniswapV3Pool
} from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {PositionPower} from './libraries/PositionPower.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/EnumerableSet.sol';
import {TickMath} from '@uniswap/v3-core/contracts/libraries/TickMath.sol';
import {FullMath} from '@uniswap/v3-core/contracts/libraries/FullMath.sol';
import {
  PoolAddress
} from '@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol';

contract Rewards is IRewards, Ownable {
  using SafeMath for uint256;
  using EnumerableSet for EnumerableSet.UintSet;

  // factory represents uniswapV3Factory
  address private factory;
  // nft manager INonfungiblePositionManager
  address private nftManager;
  address private immutable alphrToken;
  address private immutable alphrPool;

  uint256 private blockReward = 0;

  EnumerableSet.UintSet private positions;
  mapping(address => EnumerableSet.UintSet) usersPositions;

  struct PositionMeta {
    uint256 timestamp;
    uint256 blockNumber;
  }
  mapping(uint256 => PositionMeta) positionsMeta;

  constructor(
    address _factory,
    address _nftManager,
    address _alphrToken,
    address _alphrPool
  ) {
    factory = _factory;
    nftManager = _nftManager;
    alphrToken = _alphrToken;
    alphrPool = _alphrPool;
  }

  receive() external payable {}

  fallback() external payable {}

  function setFactory(address _factory) external onlyOwner {
    require(_factory != address(0), 'Empty address');
    factory = _factory;
  }

  function getFactory() public view returns (address) {
    return factory;
  }

  function setNFTManager(address _nftManager) external onlyOwner {
    require(_nftManager != address(0), 'Empty address');
    nftManager = _nftManager;
  }

  function getNFTManager() external view returns (address) {
    return nftManager;
  }

  function setBlockReward(uint256 _blockReward) external onlyOwner {
    blockReward = _blockReward;
  }

  function getBlockReward() external view returns (uint256) {
    return blockReward;
  }

  function stake(uint256 _id) external override {
    require(
      computePoolAddress(_id) == alphrPool,
      'Token should be corresponded to current pool'
    );
    require(
      INonfungiblePositionManager(nftManager).getApproved(_id) == address(this),
      'Token should be approved before stake'
    );
    INonfungiblePositionManager(nftManager).transferFrom(
      msg.sender,
      address(this),
      _id
    );

    positions.add(_id);
    usersPositions[msg.sender].add(_id);
    positionsMeta[_id] = PositionMeta(block.timestamp, block.number);

    emit NewStake(_id, msg.sender);
  }

  function unstake(uint256 _id) external override {
    require(positions.contains(_id), 'Token is not staked');

    require(usersPositions[msg.sender].remove(_id), 'User must own this token');

    INonfungiblePositionManager(nftManager).transferFrom(
      address(this),
      msg.sender,
      _id
    );
    emit NewUnstake(_id, msg.sender);
  }

  function claim() external override {}

  function staked() external view override returns (uint256[] memory staked) {
    EnumerableSet.UintSet storage ids = usersPositions[msg.sender];
    staked = new uint256[](ids.length());
    for (uint256 i = 0; i < ids.length(); i++) {
      staked[i] = ids.at(i);
    }
  }

  function rollUp() external override onlyOwner {
    revert('not implemented');
  }

  function getClaimableAmount()
    external
    view
    override
    returns (uint256 claimableAmount)
  {
    uint256 stakedPower = getStakedPositionsPower();
    EnumerableSet.UintSet storage msgSenderPositions =
      usersPositions[msg.sender];
    for (uint256 i = 0; i < msgSenderPositions.length(); i++) {
      claimableAmount += getPositionClaimableAmount(
        msgSenderPositions.at(i),
        stakedPower
      );
    }
  }

  /**
   * @dev return sum of all positions' power;
   */
  function getStakedPositionsPower() internal view returns (uint256 power) {
    for (uint256 i = 0; i < positions.length(); i++) {
      power += calculatePositionPower(positions.at(i));
    }
  }

  function calculatePositionPower(uint256 _id)
    public
    view
    returns (uint256 positionPower)
  {
    (uint256 alphr, uint256 weth) = getTokensAmountsFromPosition(_id);
    //todo replace with const;
    address wethToken = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    //todo has to be replaces with oracle's time weight cumulative tick
    (, int24 poolTick, , , , , ) = IUniswapV3PoolState(alphrPool).slot0();
    uint256 rateEthToAlphr =
      getQuoteAtTick(poolTick, 1**18, wethToken, alphrToken);
    uint256 rate = rateEthToAlphr.div(10**18);
    positionPower = weth.mul(rate);
    positionPower = positionPower.add(alphr);
  }

  function getPositionClaimableAmount(uint256 id, uint256 stakedPower)
    internal
    view
    returns (uint256 positionClaimableAmount)
  {
    uint256 positionPower = calculatePositionPower(id);
    uint256 share = positionPower.mul(10**20).div(stakedPower);
    uint256 stakedBlocks = block.number - positionsMeta[id].blockNumber;
    uint256 overallReward = stakedBlocks * blockReward;
    positionClaimableAmount = share.mul(10**20).div(overallReward);
    return positionClaimableAmount;
  }

  function getTokensAmountsFromPosition(uint256 _id)
    public
    view
    returns (uint256 token0Amount, uint256 token1Amount)
  {
    (, int24 poolTick, , , , , ) = IUniswapV3PoolState(alphrPool).slot0();
    (, , , , , int24 tickLower, int24 tickUpper, uint128 liquidity, , , , ) =
      INonfungiblePositionManager(nftManager).positions(_id);
    token0Amount = PositionPower.token0Amount(
      liquidity,
      poolTick,
      tickLower,
      tickUpper
    );
    token1Amount = PositionPower.token1Amount(
      liquidity,
      poolTick,
      tickLower,
      tickUpper
    );
  }

  function getQuoteAtTick(
    int24 tick,
    uint128 baseAmount,
    address baseToken,
    address quoteToken
  ) internal pure returns (uint256 quoteAmount) {
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

  function computePoolAddress(uint256 _id) public view returns (address) {
    (, , address token0, address token1, uint24 fee, , , , , , , ) =
      INonfungiblePositionManager(nftManager).positions(_id);
    return getPoolAddress(token0, token1, fee);
  }

  function getPoolAddress(
    address _tokenA,
    address _tokenB,
    uint24 _fee
  ) public view returns (address) {
    PoolAddress.PoolKey memory poolKey =
      PoolAddress.PoolKey({token0: _tokenA, token1: _tokenB, fee: _fee});
    return PoolAddress.computeAddress(factory, poolKey);
  }
}
