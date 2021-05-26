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

  function staked() external view override returns (uint256[] memory staked) {
    EnumerableSet.UintSet storage ids = usersPositions[msg.sender];
    staked = new uint256[](ids.length());
    for (uint256 i = 0; i < ids.length(); i++) {
      staked[i] = ids.at(i);
    }
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

  function batchTransfer(address[] memory addresses, uint256[] memory amounts)
    public
    onlyOwner
  {
    require(
      addresses.length == amounts.length,
      'Arrays must have the same length'
    );
    require(addresses.length > 0, 'Arrays must have at least one element');
    for (uint256 i = 0; i < addresses.length; i++) {
      IERC20(alphrToken).transfer(addresses[i], amounts[i]);
    }
  }
}
