pragma solidity =0.7.6;

import './interfaces/IRewards.sol';

import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol';
import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import '@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolState.sol';
import '@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol';
import {
  INonfungibleTokenPositionDescriptor
} from '@uniswap/v3-periphery/contracts/interfaces/INonfungibleTokenPositionDescriptor.sol';
import {
  IERC721Enumerable
} from '@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {
  IUniswapV3Pool
} from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {SafeMath} from '@openzeppelin/contracts/math/SafeMath.sol';
import {PositionPower} from './libraries/PositionPower.sol';
import '@openzeppelin/contracts/utils/EnumerableSet.sol';

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

  function getClaimableAmount() external view override returns (uint256) {
    return 0;
  }

  function getPositionClaimableAmount(uint256 id)
    external
    view
    returns (uint256)
  {
    uint256 a = blockReward.div(100).mul(5);
    uint256 b = block.number.sub(positionsMeta[id].blockNumber);
    uint256 res = a.mul(b);

    return res;
  }

  function getTokensAmountsFromPosition(uint256 _id)
    external
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
}
