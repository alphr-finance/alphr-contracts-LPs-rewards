pragma solidity ^0.7.5;
import './interfaces/IRewards.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol';
import '@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

contract Rewards is IRewards, Ownable {
  // factory represents uniswapV3Factory
  address private factory;

  // nft manager
  address private nftManager;

  // represents tokens that corresponds to particular user
  mapping(address => uint256[]) private userTokens;

  constructor(address _factory, address _nftManager) {
    factory = _factory;
    nftManager = _nftManager;
  }

  function stake(uint256 _id) external override returns (uint128) {
    require(
      INonfungiblePositionManager(nftManager).getApproved(_id) == address(this),
      'Token should be approved before stake'
    );

    INonfungiblePositionManager(nftManager).transferFrom(
      msg.sender,
      address(this),
      _id
    );
    userTokens[msg.sender].push(_id);
    emit NewStake(_id);

    (
      uint96 nonce,
      address operator,
      address token0,
      address token1,
      uint24 fee,
      int24 tickLower,
      int24 tickUpper,
      uint128 _liquidity,
      uint256 feeGrowthInside0LastX128,
      uint256 feeGrowthInside1LastX128,
      uint128 tokensOwed0,
      uint128 tokensOwed1
    ) = INonfungiblePositionManager(nftManager).positions(_id);

    // TO DO
    // 1) Store user as reward earner
    // 2) Freeze already earned reward for user
    // 3) recalculate reward for all users

    return _liquidity;
  }

  function unstake(address _nftToken) external override {}

  function claim() external override {}

  function getReward() external view override {}

  function setFactory(address _factory) external onlyOwner {
    require(_factory != address(0), 'Empty address');
    factory = _factory;
  }

  function getFactory() public view returns (address) {
    return factory;
  }

  function getUserTokens() external view returns (uint256[] memory) {
    uint256[] memory tokens = new uint256[](userTokens[msg.sender].length);
    tokens = userTokens[msg.sender];
    return tokens;
  }

  function setNFTManager(address _nftManager) external onlyOwner {
    nftManager = _nftManager;
  }

  function getNFTManager() external returns (address) {
    return nftManager;
  }
}
