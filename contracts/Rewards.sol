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

  function unstake(uint256 _id) external override {
    require(userTokens[msg.sender].length > 0, 'User must have staked tokens');
    uint256 index;
    bool found = false;
    // step 1 Find token
    for (uint256 i = 0; i < userTokens[msg.sender].length; i++) {
      if (userTokens[msg.sender][i] == _id) {
        index = i;
        found = true;
        break;
      }
    }

    require(found, 'User must owned this token');

    // step 2 Remove token from array
    for (uint256 i = 0; i < userTokens[msg.sender].length - 1; i++) {
      if (i >= index) {
        userTokens[msg.sender][i] = userTokens[msg.sender][i + 1];
      }
    }
    // step 3 decrease array length
    userTokens[msg.sender].pop();
    // step 4 send token to user
    INonfungiblePositionManager(nftManager).transferFrom(
      address(this),
      msg.sender,
      _id
    );

    // step 5 emit event
    emit NewUnstake(_id, msg.sender);

    // TBD: step 6 claim user reward?
  }

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
    require(_nftManager != address(0), 'Empty address');
    nftManager = _nftManager;
  }

  function getNFTManager() external returns (address) {
    return nftManager;
  }
}
