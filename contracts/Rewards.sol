pragma solidity =0.7.5;
import './interfaces/IRewards.sol';

import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol';
import '@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

contract Rewards is IRewards, Ownable {
  // factory represents uniswapV3Factory
  address private factory;
  // nft manager INonfungiblePositionManager
  address private nftManager;
  address private immutable alphrToken;

  struct Position {
    uint256 nftPosition; //  UNISWAP V3 nft token ID
    uint256 blockNumber;
  }
  // represents tokens that corresponds to particular user; TO DO change on Iterable maps
  mapping(address => Position[]) private userPositions;

  constructor(
    address _factory,
    address _nftManager,
    address _alphrToken
  ) {
    factory = _factory;
    nftManager = _nftManager;
    alphrToken = _alphrToken;
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

    userPositions[msg.sender].push(Position(_id, block.number));

    emit NewStake(_id);
  }

  function unstake(uint256 _id) external override {
    require(
      userPositions[msg.sender].length > 0,
      'User must have staked tokens'
    );
    uint256 index;
    bool found = false;
    // step 1 Find token
    for (uint256 i = 0; i < userPositions[msg.sender].length; i++) {
      if (userPositions[msg.sender][i].nftPosition == _id) {
        index = i;
        found = true;
        break;
      }
    }

    require(found, 'User must owned this token');

    // step 2 Remove token from array
    for (uint256 i = 0; i < userPositions[msg.sender].length - 1; i++) {
      if (i >= index) {
        userPositions[msg.sender][i] = userPositions[msg.sender][i + 1];
      }
    }
    // step 3 decrease array length
    userPositions[msg.sender].pop();
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

  function getClaimableAmount() external view override returns (uint256) {
    return 0;
  }

  function staked() external view override returns (uint256[] memory) {
    Position[] memory positions =
      new Position[](userPositions[msg.sender].length);
    positions = userPositions[msg.sender];
    uint256[] memory ids = new uint256[](positions.length);
    for (uint256 i = 0; i < positions.length; i++) {
      ids[i] = positions[i].nftPosition;
    }
    return ids;
  }

  function rollUp() external override onlyOwner {
    revert('not implemented');
  }

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
}
